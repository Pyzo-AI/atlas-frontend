"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuCalendar, LuCamera, LuCheck, LuCopy, LuExternalLink, LuPencil, LuTrash2 } from "react-icons/lu";
import closeIcon from "@/assets/svg/close.svg";
import FormInput from "@/components/common/FormInput";
import PhoneInput from "@/components/common/PhoneInput";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";
import PyzoLoader from "@/components/common/PyzoLoader";
import ErrorState from "@/components/common/ErrorState";
import OpenInNewTabModal from "@/components/common/OpenInNewTabModal";
import ToolIcon from "@/components/common/ToolIcon";
import { useGetSidebarToolsQuery } from "@/store/api/productsApi";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadMyAvatarMutation,
} from "@/store/api/profileApi";
import { getErrorMessage } from "@/store/utils/apiErrorHandler";
import { useOverlayTransition } from "@/hooks/useOverlayTransition";
import { getInitials } from "@/utils/initials";
import { getPhoneNumberError, joinPhoneNumber, splitPhoneNumber } from "@/utils/phone";
import { showToast } from "@/utils/toast";

// "My profile" drawer for the logged-in user, opened from the Header account
// menu. Ported from pyzo-central-frontend's ProfileDrawer.tsx (same layout,
// behavior and slide-in transition), adapted to this app's own components
// and i18n.

// Must match the backend's POST /users/me/avatar rules.
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const stripPyzo = (name) => (name || "").replace(/^pyzo\s*/i, "");

/** Same toast as Central's showApiError: "Access Denied" for a 403, the API's message otherwise. */
const useShowApiError = () => {
  const { t } = useTranslation();
  return (error, fallback) => {
    const denied = error?.status === 403;
    const message = denied ? t("profile.accessDeniedDesc") : error?.data?.message ? getErrorMessage(error) : fallback;
    showToast.error(denied ? t("profile.accessDenied") : t("profile.error"), message);
  };
};

const formatDateOnly = (dateString, language) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(language === "en" ? "en-GB" : language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Avatar({ name, src, size }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="rounded-full object-cover shrink-0 bg-white"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-gradient-to-br from-[#4C8DF6] to-[#2363D1] flex items-center justify-center shrink-0 font-lato font-semibold text-white tracking-[0.02em]"
      style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {getInitials(name) || "?"}
    </span>
  );
}

/**
 * Upload / remove for the caller's own photo, shared by the avatar menu and
 * the photo screen. Render `fileInput` once; call `pickFile` to open it.
 */
function useAvatarActions() {
  const { t } = useTranslation();
  const showApiError = useShowApiError();
  const fileRef = useRef(null);
  const [uploadMyAvatar, { isLoading: isUploading }] = useUploadMyAvatarMutation();
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      showToast.error(t("profile.unsupportedImage"), t("profile.unsupportedImageDesc"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showToast.error(t("profile.imageTooLarge"), t("profile.imageTooLargeDesc"));
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { url } = await uploadMyAvatar(formData).unwrap();
      await updateMyProfile({ avatar_url: url }).unwrap();
      showToast.success(t("profile.photoUpdated"));
    } catch (err) {
      showApiError(err, t("profile.photoUpdateFailed"));
    }
  };

  /** Resolves true when the photo was removed. */
  const removePhoto = async () => {
    try {
      await updateMyProfile({ avatar_url: null }).unwrap();
      showToast.success(t("profile.photoRemoved"));
      return true;
    } catch (err) {
      showApiError(err, t("profile.photoRemoveFailed"));
      return false;
    }
  };

  return {
    isBusy: isUploading || isSaving,
    isUploading,
    pickFile: () => fileRef.current?.click(),
    removePhoto,
    fileInput: <input ref={fileRef} type="file" accept={AVATAR_TYPES.join(",")} className="hidden" onChange={onPickFile} />,
  };
}

/**
 * The view-mode avatar doubles as the photo control: picking a file uploads
 * it and saves it straight to the profile, no Edit step needed. With a photo
 * set, clicking opens a small menu (view / replace / remove) instead.
 */
function EditableAvatar({ name, src, onView }) {
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    shouldRender: menuShouldRender,
    transitionStyle: menuTransitionStyle,
    dropdownTransitionClassName,
  } = useOverlayTransition(menuOpen, false);
  const { isBusy, pickFile, removePhoto, fileInput } = useAvatarActions();

  const menuItems = [
    { action: "view", title: t("profile.viewPhoto") },
    { action: "upload", title: t("profile.uploadNewPhoto") },
    { action: "remove", title: t("profile.removePhoto"), textColor: "#F04638" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const runAction = (action) => {
    setMenuOpen(false);
    if (action === "upload") pickFile();
    else if (action === "remove") removePhoto();
    else onView();
  };

  return (
    <div ref={menuRef} className="relative w-fit">
      {fileInput}
      <button
        type="button"
        onClick={() => (src ? setMenuOpen((o) => !o) : pickFile())}
        disabled={isBusy}
        aria-label={src ? t("profile.changePhotoAria") : t("profile.uploadPhotoAria")}
        aria-haspopup={src ? "menu" : undefined}
        className="group relative block rounded-full ring-4 ring-white shadow-[0_2px_10px_rgba(15,23,42,0.12)] cursor-pointer disabled:cursor-wait">
        <Avatar name={name} src={src} size={84} />
        <span
          className={`absolute inset-0 rounded-full bg-[#0F172A]/50 flex items-center justify-center text-white transition-opacity duration-150 ${
            isBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          }`}>
          {isBusy ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <LuCamera className="w-5 h-5" />
          )}
        </span>
        {/* Always visible so the photo reads as editable on touch, where there's no hover. */}
        <span className="absolute -bottom-0.5 -right-0.5 w-[26px] h-[26px] rounded-full bg-white ring-1 ring-[#E2E8F0] shadow-sm flex items-center justify-center text-[#334155]">
          <LuCamera className="w-[13px] h-[13px]" />
        </span>
      </button>

      {menuShouldRender && (
        <div
          role="menu"
          className={`absolute left-0 top-[calc(100%+6px)] z-10 origin-top-left bg-white border border-[#E5E7EB] rounded-[8px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] min-w-[111px] flex flex-col overflow-hidden ${dropdownTransitionClassName}`}
          style={menuTransitionStyle}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.action}>
              {index > 0 && <div className="h-[1px] bg-[#F3F3F3] w-full self-stretch" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(item.action)}
                className="flex items-center w-full p-[10px] gap-[10px] hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ height: "29px" }}>
                <span
                  className="font-lato font-normal text-[12px] leading-[150%] whitespace-nowrap"
                  style={{ color: item.textColor ?? "#4B5563" }}>
                  {item.title}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="px-6 py-5 border-t border-[#EEF0F3]">
      <h4 className="mb-3 font-lato font-bold text-[11px] leading-[14px] uppercase tracking-[0.06em] text-[#94A3B8]">
        {title}
      </h4>
      <dl className="flex flex-col gap-3">{children}</dl>
    </section>
  );
}

/** Label/value row; an empty value renders a muted "Not set" instead of a bare dash. */
function Field({ label, children }) {
  const { t } = useTranslation();
  const empty = children === null || children === undefined || children === "";
  return (
    <div className="grid grid-cols-[92px_1fr] sm:grid-cols-[112px_1fr] items-baseline gap-3">
      <dt className="font-lato text-[12px] leading-[18px] text-[#64748B]">{label}</dt>
      <dd
        className={`font-lato text-[13px] leading-[18px] min-w-0 break-words ${
          empty ? "text-[#94A3B8]" : "text-[#0F172A]"
        }`}>
        {empty ? t("profile.notSet") : children}
      </dd>
    </div>
  );
}

/**
 * Tools the member can reach. Each chip behaves like the sidebar's tool
 * switcher: the tool you're in is marked current and isn't clickable; any
 * other opens through the same "open in new tab" confirmation, at the
 * switcher's own redirect URL (GET /products/sidebar-tools).
 */
function ToolsAccessSection({ tools }) {
  const { t } = useTranslation();
  const { data: switcherTools = [] } = useGetSidebarToolsQuery();
  const [pendingTool, setPendingTool] = useState(null);
  const byId = new Map(switcherTools.map((tool) => [tool.id, tool]));
  // Same order as the sidebar switcher's list: current tool first, then the
  // switcher's own order. Tools the switcher doesn't list go last.
  const switcherOrder = [...switcherTools]
    .sort((a, b) => Number(b.is_current) - Number(a.is_current))
    .map((tool) => tool.id);
  const rank = (id) => {
    const i = switcherOrder.indexOf(id);
    return i === -1 ? switcherOrder.length : i;
  };
  const ordered = [...tools].sort((a, b) => rank(a.id) - rank(b.id));

  return (
    <section className="px-6 py-5 border-t border-[#EEF0F3]">
      <h4 className="mb-3 flex items-center gap-2 font-lato font-bold text-[11px] leading-[14px] uppercase tracking-[0.06em] text-[#94A3B8]">
        {t("profile.toolsAccess")}
        {tools.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EFF5FF] font-lato font-bold text-[10px] tracking-normal text-[#2877EE]">
            {tools.length}
          </span>
        )}
      </h4>
      {tools.length === 0 ? (
        <p className="font-lato text-[13px] text-[#94A3B8]">{t("profile.noTools")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ordered.map((tool) => {
            const sw = byId.get(tool.id);
            const isCurrent = sw?.is_current ?? false;
            const canOpen = !isCurrent && !!sw?.redirect_url;
            const miniIcon = sw?.mini_icon ?? tool.mini_icon;
            const icon = (
              <span className="w-[18px] h-[18px] rounded-[5px] border-[0.75px] border-[#E6E6E6] bg-white flex items-center justify-center overflow-hidden shrink-0">
                {miniIcon ? (
                  <Image src={miniIcon} alt="" width={12} height={12} unoptimized className="object-contain" />
                ) : isCurrent && sw ? (
                  <Image src={sw.icon} alt="" width={14} height={5} unoptimized className="w-[14px] h-[5px] object-contain" />
                ) : (
                  <ToolIcon toolId={tool.id} size={11} />
                )}
              </span>
            );
            const label = <span className="font-lato font-medium text-[12px] text-[#1E293B]">{stripPyzo(tool.name)}</span>;

            return isCurrent ? (
              <span
                key={tool.id}
                className="inline-flex items-center gap-1.5 h-[28px] pl-1.5 pr-2 rounded-[8px] bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                {icon}
                {label}
                <LuCheck className="w-3.5 h-3.5 text-[#2877EE]" aria-label={t("profile.currentTool")} />
              </span>
            ) : (
              <button
                key={tool.id}
                type="button"
                onClick={() => sw && setPendingTool(sw)}
                disabled={!canOpen}
                title={canOpen ? t("profile.openTool", { name: stripPyzo(tool.name) }) : undefined}
                className="group inline-flex items-center gap-1.5 h-[28px] pl-1.5 pr-2 rounded-[8px] bg-white ring-1 ring-[#E2E8F0] hover:ring-[#2877EE] hover:bg-[#F5F9FF] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-[#E2E8F0] disabled:hover:bg-white">
                {icon}
                {label}
                <LuExternalLink className="w-3 h-3 text-[#94A3B8] group-hover:text-[#2877EE] transition-colors" />
              </button>
            );
          })}
        </div>
      )}
      <OpenInNewTabModal
        isOpen={pendingTool !== null}
        onClose={() => setPendingTool(null)}
        onConfirm={() => {
          if (pendingTool?.redirect_url) window.open(pendingTool.redirect_url, "_blank", "noopener,noreferrer");
        }}
      />
    </section>
  );
}

function ProfileView({ profile, onEdit, onViewPhoto }) {
  const { t, i18n } = useTranslation();
  const name = profile.full_name || profile.email;
  const [copied, setCopied] = useState(false);
  const isActive = profile.status === "active";

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast.error(t("profile.copyEmailFailed"));
    }
  };

  return (
    <div className="flex flex-col pb-[calc(16px+env(safe-area-inset-bottom))]">
      {/* Identity header */}
      <div className="relative">
        <div className="px-6 pt-6 flex items-end justify-between gap-3">
          <EditableAvatar name={name} src={profile.avatar_url} onView={onViewPhoto} />
          <SecondaryButton
            onClick={onEdit}
            height="30px"
            className="px-3 !text-[12px] !font-semibold gap-1.5 shrink-0">
            <LuPencil className="w-3.5 h-3.5" />
            {t("profile.editProfile")}
          </SecondaryButton>
        </div>
        <div className="px-6 pt-3 pb-5 flex flex-col gap-1">
          <h3 className="font-lato font-bold text-[20px] leading-[26px] text-[#0F172A] break-words">{name}</h3>
          {profile.designation && (
            <p className="font-lato text-[13px] leading-[18px] text-[#475569]">{profile.designation}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[#EEF4FE] text-[#2363D1] font-lato font-semibold text-[11px]">
              {profile.role === "admin" ? t("profile.orgAdmin") : t("profile.member")}
            </span>
            <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[#F8FAFC] ring-1 ring-[#E2E8F0] font-lato font-medium text-[11px] text-[#475569]">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#22A06B]" : "bg-[#94A3B8]"}`} />
              {isActive ? t("profile.active") : t("profile.inactive")}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 font-lato text-[12px] leading-[16px] text-[#64748B]">
            <LuCalendar className="w-3.5 h-3.5 text-[#94A3B8]" />
            {t("profile.memberSince", { date: formatDateOnly(profile.joined_at, i18n.language) })}
          </p>
        </div>
      </div>

      <Section title={t("profile.contact")}>
        <Field label={t("profile.email")}>
          <span className="inline-flex items-start gap-1.5 max-w-full">
            <span className="break-all">{profile.email}</span>
            <button
              type="button"
              aria-label={t("profile.copyEmail")}
              title={copied ? t("profile.copied") : t("profile.copy")}
              onClick={copyEmail}
              className="shrink-0 p-1.5 -m-1.5 rounded text-[#94A3B8] hover:text-[#2877EE] hover:bg-[#F1F5F9] cursor-pointer">
              {copied ? <LuCheck className="w-3.5 h-3.5 text-[#22A06B]" /> : <LuCopy className="w-3.5 h-3.5" />}
            </button>
          </span>
        </Field>
        <Field label={t("profile.phone")}>
          {profile.phone_number || (
            <button
              type="button"
              onClick={onEdit}
              className="font-lato text-[13px] text-[#2877EE] hover:underline cursor-pointer">
              {t("profile.addPhone")}
            </button>
          )}
        </Field>
      </Section>

      <ToolsAccessSection tools={profile.tools || []} />
    </div>
  );
}

// full_name is stored as `${first} ${last}` and re-split on spaces, so a
// space inside a part would silently move to the other field on the next edit.
const sanitizeNamePart = (v) => v.replace(/[^a-zA-Z'-]/g, "");

/** Older accounts may only have full_name — split it the same way Central does. */
function initialNameParts(profile) {
  if (profile.first_name || profile.last_name) {
    return { first: profile.first_name ?? "", last: profile.last_name ?? "" };
  }
  const parts = (profile.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

function ProfileEdit({ profile, onDone }) {
  const { t } = useTranslation();
  const showApiError = useShowApiError();
  const original = splitPhoneNumber(profile.phone_number);
  const originalName = initialNameParts(profile);
  const [firstName, setFirstName] = useState(originalName.first);
  const [lastName, setLastName] = useState(originalName.last);
  const [countryCode, setCountryCode] = useState(original.countryCode);
  const [phoneDigits, setPhoneDigits] = useState(original.digits);
  const [errors, setErrors] = useState({});
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const onSave = async () => {
    const nextErrors = {};
    if (!firstName.trim()) nextErrors.firstName = t("profile.firstNameRequired");
    const phoneRange = getPhoneNumberError(countryCode, phoneDigits.trim());
    if (phoneRange) {
      nextErrors.phone =
        phoneRange.min === phoneRange.max
          ? t("profile.phoneInvalidExact", { count: phoneRange.min })
          : t("profile.phoneInvalidRange", { min: phoneRange.min, max: phoneRange.max });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Only send what changed — every field is optional on PATCH /users/me.
    const body = {};
    // Compared against the stored parts (not the full_name fallback) so a
    // legacy full_name-only account gets first/last written on first save.
    if (firstName.trim() !== (profile.first_name ?? "")) body.first_name = firstName.trim();
    if (lastName.trim() !== (profile.last_name ?? "")) body.last_name = lastName.trim();
    if (countryCode !== original.countryCode || phoneDigits.trim() !== original.digits) {
      body.phone_number = joinPhoneNumber(countryCode, phoneDigits.trim()) ?? null;
    }

    if (Object.keys(body).length === 0) {
      onDone();
      return;
    }
    try {
      await updateMyProfile(body).unwrap();
      showToast.success(t("profile.profileUpdated"));
      onDone();
    } catch (err) {
      showApiError(err, t("profile.profileUpdateFailed"));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-5 p-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label={t("profile.firstName")}
            value={firstName}
            onChange={(v) => setFirstName(sanitizeNamePart(v))}
            error={errors.firstName}
          />
          <FormInput label={t("profile.lastName")} value={lastName} onChange={(v) => setLastName(sanitizeNamePart(v))} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-lato text-[12px] font-bold leading-[16px] text-[#1D1F2C]">{t("profile.phoneNumber")}</label>
          <PhoneInput
            value={phoneDigits}
            onChange={setPhoneDigits}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            isError={!!errors.phone}
            errorMessage={errors.phone}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-lato text-[12px] font-bold leading-[16px] text-[#1D1F2C]">{t("profile.email")}</label>
          <div className="w-full h-[32px] border border-[#E5E7EB] rounded-[6px] flex items-center px-2 bg-[#F9FAFB] font-lato text-[12px] text-[#64748B]">
            {profile.email}
          </div>
          <span className="font-lato text-[11px] text-[#64748B]">{t("profile.managedByAdmin")}</span>
        </div>
      </div>

      <div className="px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] border-t border-[#E4E4F0] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
        <SecondaryButton
          onClick={onDone}
          disabled={isSaving}
          height="30px"
          className="flex-1 sm:flex-none sm:min-w-[118px] px-4 !text-[12px] !font-semibold">
          {t("profile.cancel")}
        </SecondaryButton>
        <PrimaryButton
          onClick={onSave}
          disabled={isSaving}
          height="30px"
          className="flex-1 sm:flex-none sm:min-w-[118px] px-4 !text-[12px] !font-semibold">
          {isSaving ? t("profile.saving") : t("profile.saveChanges")}
        </PrimaryButton>
      </div>
    </div>
  );
}

/** In-drawer photo screen: large preview with the photo actions right below it. */
function PhotoView({ name, src, onRemoved }) {
  const { t } = useTranslation();
  const { isBusy, isUploading, pickFile, removePhoto, fileInput } = useAvatarActions();

  return (
    <div className="flex flex-col gap-5 px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
      {fileInput}
      <div className="relative w-full aspect-square rounded-[20px] overflow-hidden bg-[#F8FAFC] ring-1 ring-[#EEF0F3] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
        <Image src={src} alt={name} fill sizes="(max-width: 420px) 100vw, 372px" unoptimized className="object-cover" />
        {isBusy && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="w-7 h-7 rounded-full border-[3px] border-[#2877EE]/25 border-t-[#2877EE] animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-lato font-bold text-[16px] leading-[22px] text-[#0F172A] break-words">{name}</p>
        <p className="font-lato text-[12px] leading-[18px] text-[#64748B]">{t("profile.photoVisibility")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton
          onClick={pickFile}
          disabled={isBusy}
          height="36px"
          className="!text-[12px] !font-semibold gap-1.5">
          <LuCamera className="w-4 h-4" />
          {isUploading ? t("profile.uploading") : t("profile.changePhoto")}
        </SecondaryButton>
        <button
          type="button"
          onClick={async () => {
            if (await removePhoto()) onRemoved();
          }}
          disabled={isBusy}
          className="h-[36px] rounded-[6px] border border-[#FAD4D0] bg-white font-lato font-semibold text-[12px] text-[#F04638] hover:bg-[#FEF2F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
          <LuTrash2 className="w-4 h-4" />
          {t("profile.remove")}
        </button>
      </div>

      <p className="font-lato text-[11px] leading-[16px] text-[#94A3B8] text-center">{t("profile.photoRules")}</p>
    </div>
  );
}

export default function ProfileDrawer({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [screen, setScreen] = useState("profile");
  // Not fetched until first opened, then kept subscribed — RTK Query 2 clears
  // `data` when skip turns back on, which would flash the loader while the
  // drawer slides out.
  const [hasOpened, setHasOpened] = useState(isOpen);
  const { data: profile, isLoading, isError, refetch } = useGetMyProfileQuery(undefined, { skip: !hasOpened });
  // Same slide-in-from-the-right transition as Central's Modal variant="drawer-right".
  const { shouldRender, transitionStyle, backdropTransitionClassName, rightDrawerTransitionClassName } =
    useOverlayTransition(isOpen);

  // Always reopen in view mode. Reset on open (not on close) so the closing
  // animation doesn't flash from the edit form back to the view.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setScreen("profile");
      setHasOpened(true);
    }
  }

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex justify-end bg-black/50 ${backdropTransitionClassName}`}
      style={transitionStyle}
      onClick={onClose}>
      <div
        className={`bg-white h-full shadow-[-7px_3px_34px_0px_rgba(217,217,233,0.3)] border-l border-[#E5E5E5] overflow-hidden flex flex-col font-lato ${rightDrawerTransitionClassName}`}
        style={{ width: "min(420px, 100vw)", ...transitionStyle }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 h-12 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0">
          {screen === "photo" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("profile.backToProfile")}
                onClick={() => setScreen("profile")}
                className="p-1 -ml-1 rounded-full text-[#111827] hover:bg-gray-50 transition-colors cursor-pointer">
                <LuArrowLeft className="w-[18px] h-[18px]" />
              </button>
              <h2 className="text-[16px] font-bold text-[#111827]">{t("profile.profilePhoto")}</h2>
            </div>
          ) : (
            <h2 className="text-[16px] font-bold text-[#111827]">
              {screen === "edit" ? t("profile.editProfile") : t("profile.title")}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("profile.close")}
            className="p-1 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
            <Image src={closeIcon} alt="" width={20} height={20} unoptimized />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <PyzoLoader fullScreen={false} isLoading={isLoading || (!profile && !isError)}>
            {isError || !profile ? (
              <ErrorState title={t("profile.loadFailed")} onRetry={refetch} fullScreen={false} />
            ) : screen === "edit" ? (
              <ProfileEdit profile={profile} onDone={() => setScreen("profile")} />
            ) : screen === "photo" && profile.avatar_url ? (
              <PhotoView
                name={profile.full_name || profile.email}
                src={profile.avatar_url}
                onRemoved={() => setScreen("profile")}
              />
            ) : (
              <ProfileView profile={profile} onEdit={() => setScreen("edit")} onViewPhoto={() => setScreen("photo")} />
            )}
          </PyzoLoader>
        </div>
      </div>
    </div>,
    document.body
  );
}
