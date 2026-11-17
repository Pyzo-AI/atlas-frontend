import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLazyGetChatSourceDocumentQuery } from "@/store/api/questionsApi";
import { showToast } from "@/utils/toast";

/**
 * "Sources" row under an AI answer in the interactive chat: the slides and module documents the answer
 * came from (metadata.sources, sent by the AI engine); also used by the org global chat, without a presentationId. A document opens in a new tab at the cited page
 * (for a DOCX the backend finds the page from the cited passage, and the chip shows it once found); a slide jumps the player to that slide. Documents of older (legacy) modules have no
 * document_id and are shown without a link.
 */
const AnswerSources = ({ sources, presentationId, onOpenSlide, compact = false }) => {
  const { t } = useTranslation();
  const [openingKey, setOpeningKey] = useState(null);
  const [foundPages, setFoundPages] = useState({});
  const [getDocument] = useLazyGetChatSourceDocumentQuery();

  if (!Array.isArray(sources) || sources.length === 0) return null;

  const openDocument = async (source, key) => {
    // Open the tab synchronously (inside the click) so pop-up blockers allow it, then point it at the link
    const tab = window.open("", "_blank");
    setOpeningKey(key);
    try {
      const result = await getDocument({
        presentationId,
        documentId: source.document_id,
        page: source.page,
        text: source.page ? undefined : source.snippet,
      }).unwrap();
      const url = result?.data?.url;
      if (!url) throw new Error("No document URL");
      if (!source.page && result?.data?.page) {
        setFoundPages((pages) => ({ ...pages, [key]: result.data.page }));
      }
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (tab) tab.close();
      showToast.error(t("chatUI.sourceOpenFailed"));
    } finally {
      setOpeningKey(null);
    }
  };

  const textSize = compact ? "text-[9px] lg:text-[11px]" : "text-[10px] sm:text-[11px] lg:text-[12px]";
  const chipBase =
    `inline-flex items-center gap-1 max-w-full rounded-full border border-[#D5DAE5] bg-[#F4F6FA] px-2 py-0.5 ` +
    `font-lato font-medium ${textSize} text-primary-text`;
  const clickable = "cursor-pointer hover:bg-[#E2E5EE] transition-colors disabled:opacity-60 disabled:cursor-wait";

  return (
    <div className="flex flex-wrap items-center gap-1 lg:gap-1.5 mt-0.5">
      <span className={`font-lato ${textSize} text-primary-text-muted`}>{t("chatUI.sources")}:</span>
      {sources.map((source, idx) => {
        const key = `${source.kind}-${source.document_id ?? source.name ?? source.slide_number}-${source.page ?? ""}-${idx}`;

        if (source.kind === "slide") {
          const label = t("chatUI.slide", { number: source.slide_number });
          return (
            <button
              key={key}
              type="button"
              title={source.title ? `${label}: ${source.title}` : t("chatUI.goToSlide", { number: source.slide_number })}
              onClick={onOpenSlide ? () => onOpenSlide(source.slide_number) : undefined}
              disabled={!onOpenSlide}
              className={`${chipBase} ${onOpenSlide ? clickable : ""}`}>
              <span aria-hidden="true">▣</span>
              <span className="truncate">{label}</span>
            </button>
          );
        }

        const page = source.page || foundPages[key];
        const label = page ? `${source.name} · ${t("chatUI.page", { page })}` : source.name;
        // Without a module (global chat) the document opens by its id alone
        const canOpen = Boolean(source.document_id);
        return (
          <button
            key={key}
            type="button"
            title={source.snippet ? `“${source.snippet}”` : label}
            aria-label={canOpen ? t("chatUI.openSource", { name: label }) : label}
            onClick={canOpen ? () => openDocument(source, key) : undefined}
            disabled={!canOpen || openingKey === key}
            className={`${chipBase} ${canOpen ? clickable : ""}`}>
            <span aria-hidden="true">📄</span>
            <span className="truncate max-w-[160px] lg:max-w-[220px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnswerSources;
