"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { useGetChatsQuery, useGetChatDetailQuery } from "@/store/api/questionsApi";
import SearchBar from "@/components/common/SearchBar";
import PyzoLoader from "@/components/common/PyzoLoader";
import ScrollingText from "@/components/common/ScrollingText";
import aiOverviewIcon from "@/assets/svg/ai-overview-icon.svg";
import aiOverviewChevron from "@/assets/svg/ai-overview-chevron.svg";
import aiAvatarIcon from "@/assets/svg/chat-ai-avatar-icon.svg";

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

const formatListDateTime = (iso, t) => {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(date, now)) return `${t("chats.today")}, ${time}`;
  if (isSameDay(date, yesterday)) return `${t("chats.yesterday")}, ${time}`;
  const datePart = date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })
    .replace(/\//g, "-");
  return `${datePart}, ${time}`;
};

const formatDateDivider = (iso, t) => {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, now)) return t("chats.today");
  if (isSameDay(date, yesterday)) return t("chats.yesterday");
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

const groupMessagesByDay = (messages) => {
  const groups = [];
  let currentKey = null;
  for (const message of messages) {
    const key = new Date(message.timestamp).toDateString();
    if (key !== currentKey) {
      groups.push({ key, timestamp: message.timestamp, messages: [] });
      currentKey = key;
    }
    groups[groups.length - 1].messages.push(message);
  }
  return groups;
};

const MessageBubble = ({ message }) => {
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (message.type === "user") {
    return (
      <div className="flex flex-col items-end gap-1 self-end max-w-[70%]">
        <div className="bg-[#2762EA] text-white rounded-[12px_12px_0px_12px] p-2.5">
          <p className="font-lato font-medium text-xs leading-[1.3em] whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="font-lato text-[9px] leading-[13.5px] text-[#6A7282]">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 self-start max-w-[70%]">
      <Image src={aiAvatarIcon} alt="" width={32} height={32} className="shrink-0" />
      <div className="flex flex-col gap-1">
        <div className="bg-[rgba(26,26,26,0.07)] rounded-[10px_10px_10px_0px] px-2.5 py-2">
          <p className="font-lato text-[13px] leading-[18px] text-[#1A1C29] whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="font-lato text-[9px] leading-[13.5px] text-[#6A7282]">{time}</span>
      </div>
    </div>
  );
};

const ChatListRowSkeleton = () => (
  <div className="flex items-center justify-between gap-2 h-9 px-3 border-b border-[rgba(229,231,235,0.6)] animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-2/3" />
    <div className="h-3 bg-gray-100 rounded w-12 shrink-0" />
  </div>
);

const ChatMessageSkeleton = () => (
  <>
    <div className="flex items-center justify-between px-4 py-[11.5px] border-b border-[#E5E5E5] shrink-0 animate-pulse">
      <div className="h-3.5 bg-gray-200 rounded w-40" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
    <div className="flex flex-col gap-4 p-4 flex-1 overflow-hidden animate-pulse">
      <div className="flex items-start gap-2 self-start max-w-[70%]">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="h-10 w-64 bg-gray-100 rounded-[10px_10px_10px_0px]" />
      </div>
      <div className="flex flex-col items-end gap-1 self-end max-w-[70%] w-full">
        <div className="h-8 w-48 bg-gray-200 rounded-[12px_12px_0px_12px]" />
      </div>
      <div className="flex items-start gap-2 self-start max-w-[70%]">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="h-14 w-72 bg-gray-100 rounded-[10px_10px_10px_0px]" />
      </div>
    </div>
  </>
);

const CHATS_PAGE_SIZE = 30;

export default function Chats() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [allChats, setAllChats] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const listScrollRef = useRef(null);

  // Reset back to page 1 whenever the search term changes
  useEffect(() => {
    setPage(1);
    setAllChats([]);
    setSelectedConversationId(null);
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
  }, [searchTerm]);

  const {
    data: chatsData,
    isLoading: chatsLoading,
    isFetching: chatsFetching,
  } = useGetChatsQuery({ search: searchTerm, page, pageSize: CHATS_PAGE_SIZE });

  // Each page is a real backend request; append (page > 1) or replace (page 1 / new search)
  useEffect(() => {
    if (!chatsData) return;
    setAllChats((prev) => {
      if (page === 1) return chatsData.data;
      const existingIds = new Set(prev.map((c) => c.conversation_id));
      return [...prev, ...chatsData.data.filter((c) => !existingIds.has(c.conversation_id))];
    });
  }, [chatsData, page]);

  const hasNextPage = !!chatsData?.pagination?.has_next;
  const chats = allChats;

  const handleListScroll = (e) => {
    if (!hasNextPage || chatsFetching) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (!selectedConversationId && chats.length > 0) {
      setSelectedConversationId(chats[0].conversation_id);
    }
  }, [chats, selectedConversationId]);

  const { data: detail, isFetching: detailLoading } = useGetChatDetailQuery(selectedConversationId, {
    skip: !selectedConversationId,
  });

  useEffect(() => {
    setOverviewOpen(true);
  }, [selectedConversationId]);

  // Full-screen loader only for the very first mount (list + its first
  // conversation's detail); every later fetch (search, page, switching
  // chats) shows an in-place skeleton instead.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (hasLoadedOnce || chatsLoading) return;
    const waitingOnFirstDetail = chats.length > 0 && (!selectedConversationId || detailLoading || !detail);
    if (waitingOnFirstDetail) return;
    setHasLoadedOnce(true);
  }, [hasLoadedOnce, chatsLoading, chats, selectedConversationId, detailLoading, detail]);

  const messageGroups = detail ? groupMessagesByDay(detail.messages) : [];
  const headerDate = detail?.messages?.length
    ? formatListDateTime(detail.messages[detail.messages.length - 1].timestamp, t)
    : "";

  if (!hasLoadedOnce) {
    return <PyzoLoader fullScreen />;
  }

  return (
    <div className="w-full h-[calc(100vh-45px)] overflow-hidden bg-[#F9FAFB]">
      <div className="flex flex-col h-full items-stretch gap-5 w-full px-4 sm:px-5 py-5 max-w-[1240px] mx-auto">
        {/* Page header */}
        <div className="flex flex-col gap-1 w-full shrink-0">
          <h1 className="font-lato font-bold text-base text-[#111827]">{t("chats.title")}</h1>
          <p className="font-lato text-xs text-[#4B5563]">{t("chats.subtitle")}</p>
        </div>

        {/* Only ever tears down the whole shell (incl. the search bar) for the
            "never chatted at all" case - a search that matches nothing keeps
            the shell mounted and shows "no results" inside the list instead,
            so the search input never loses focus/gets unmounted mid-search. */}
        {chats.length === 0 && !searchTerm && !(chatsFetching && page === 1) ? (
          <div className="flex flex-col items-center justify-center w-full flex-1">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bg-light-purple rounded-full flex items-center justify-center">
                <HiOutlineChatBubbleLeftRight className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 className="font-lato font-semibold text-lg sm:text-xl text-primary-text">{t("chats.emptyStateTitle")}</h3>
              <p className="font-lato text-sm text-text-muted max-w-[320px]">{t("chats.emptyStateDesc")}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 w-full flex-1 min-h-0">
            {/* Left pane: module chat list */}
            <div className="w-[323px] h-full shrink-0 flex flex-col bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="p-2.5 shrink-0">
                <SearchBar
                  initialValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  placeholder={t("chats.searchPlaceholder")}
                  width="100%"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-[#E9EFFD] border-b border-[#E5E7EB] shrink-0">
                <span className="font-lato font-semibold text-xs tracking-[0.02em] text-[#4B5563]">
                  {t("chats.listHeaderName")}
                </span>
                <span className="font-lato font-semibold text-xs tracking-[0.02em] text-[#4B5563]">
                  {t("chats.listHeaderDateTime")}
                </span>
              </div>
              <div ref={listScrollRef} onScroll={handleListScroll} className="flex flex-col flex-1 overflow-y-auto">
                {chatsFetching && page === 1 ? (
                  Array.from({ length: 8 }).map((_, i) => <ChatListRowSkeleton key={i} />)
                ) : chats.length === 0 ? (
                  <div className="flex items-center justify-center px-3 py-6 text-center">
                    <p className="font-lato text-xs text-[#6A7282]">{t("chats.noSearchResults")}</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                      const active = chat.conversation_id === selectedConversationId;
                      return (
                        <button
                          key={chat.conversation_id}
                          onClick={() => setSelectedConversationId(chat.conversation_id)}
                          className={`flex items-center justify-between gap-2 h-9 px-3 border-b border-[rgba(229,231,235,0.6)] text-left cursor-pointer transition-colors duration-150 shrink-0 ${
                            active ? "bg-[#F9FAFB]" : "bg-white hover:bg-gray-50"
                          }`}>
                          <ScrollingText
                            text={chat.label}
                            className="flex-1 min-w-0"
                            style={{
                              fontFamily: "Lato, sans-serif",
                              fontWeight: 400,
                              fontSize: "12px",
                              color: active ? "#2762EA" : "#111827",
                              textAlign: "left",
                            }}
                          />
                          <span className="font-lato text-xs text-[#4B5563] shrink-0 whitespace-nowrap">
                            {formatListDateTime(chat.last_message_at, t)}
                          </span>
                        </button>
                      );
                    })
                )}
                {chatsFetching && page > 1 && (
                  <div className="flex items-center justify-center py-2.5 shrink-0">
                    <span className="font-lato text-xs text-[#6A7282]">{t("chats.loadingMore")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right pane: selected conversation */}
            <div className="flex-1 min-w-0 h-full flex flex-col bg-white rounded-lg overflow-hidden">
              {!selectedConversationId ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-lato text-sm text-[#6A7282]">{t("chats.selectChatPrompt")}</p>
                </div>
              ) : detailLoading || !detail ? (
                <ChatMessageSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-[11.5px] border-b border-[#E5E5E5] shrink-0">
                    <span className="font-lato font-semibold text-sm text-[#111827]">{detail.label}</span>
                    <span className="font-lato text-xs text-[#4B5563]">{headerDate}</span>
                  </div>

                  <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
                    {detail.ai_overview && detail.ai_overview.length > 0 && (
                      <div className="flex flex-col gap-2.5 p-2.5 bg-[#E9EFFD] border border-[rgba(39,98,234,0.4)] rounded-xl">
                        <button
                          type="button"
                          onClick={() => setOverviewOpen((open) => !open)}
                          className="flex items-center justify-between gap-2 w-full cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Image src={aiOverviewIcon} alt="" width={16} height={16} />
                            <span className="font-lato font-bold text-sm leading-[24px] text-[#2762EA]">
                              {t("chats.aiOverviewTitle")}
                            </span>
                          </div>
                          <Image
                            src={aiOverviewChevron}
                            alt=""
                            width={16}
                            height={16}
                            className={`transition-transform duration-200 ${overviewOpen ? "" : "rotate-180"}`}
                          />
                        </button>
                        {overviewOpen && (
                          <div className="flex flex-col gap-1">
                            {detail.ai_overview.map((bullet, i) => (
                              <p key={i} className="font-lato text-xs leading-[21px] text-[#111827]">
                                {"- "}
                                {bullet}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-10">
                      {messageGroups.map((group) => (
                        <div key={group.key} className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-[#D1D5DC]" />
                            <span className="font-lato text-xs text-[#6A7282] whitespace-nowrap">
                              {formatDateDivider(group.timestamp, t)}
                            </span>
                            <div className="flex-1 h-px bg-[#D1D5DC]" />
                          </div>
                          <div className="flex flex-col gap-3">
                            {group.messages.map((message) => (
                              <MessageBubble key={message.id} message={message} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
