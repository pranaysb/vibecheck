"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { Bell, CheckCheck, ExternalLink, ShieldAlert, Sparkles, TrendingUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SCORE_IMPROVED":
        return <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "REVIEW_RECEIVED":
        return <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />;
      case "EXPERT_UPDATE":
        return <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />;
      case "REPORT_STATUS":
        return <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-slate-950" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-white/10 bg-slate-950 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No notifications yet</div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`pt-2 first:pt-0 flex items-start gap-2.5 p-1.5 rounded-md transition-colors ${
                      item.isRead ? "opacity-75 hover:opacity-100" : "bg-emerald-500/5 border-l-2 border-emerald-500"
                    }`}
                  >
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-200 truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-1 font-medium"
                        >
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
