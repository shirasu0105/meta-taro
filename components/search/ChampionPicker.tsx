"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { championIconUrl } from "@/lib/ddragon";
import { searchChampions } from "@/lib/search";
import type { Champion } from "@/lib/types";

/**
 * チャンピオン入力（オートコンプリート）。通常レーン・BOT両タブで共用（06_ui §4.2）。
 * 選択済みなら アイコン+名前+「×」解除、未選択なら テキスト入力+候補ドロップダウン。
 *
 * IME（日本語入力）対応（06_ui §6.1 / T-801）:
 * - 変換中は候補ドロップダウンを描画しない（IMEの予測変換ウィンドウとの衝突を避ける）。
 *   ただしタッチ端末は例外（候補バーがキーボード固定で衝突しないため）
 * - 変換中は Enter / ↑ / ↓ / Escape を一切処理しない（全環境で無条件）
 * - 変換中は入力欄の上のラベル行に「候補 N件」を出して補う
 */
export function ChampionPicker({
  label,
  lane,
  selected,
  onSelect,
  excludeIds = [],
  autoFocus = false,
}: {
  label?: string;
  lane?: string;
  selected: Champion | null;
  onSelect: (champion: Champion | null) => void;
  excludeIds?: string[];
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // IME変換中。描画用の state と、keydown から同期的に読む ref の二重持ち
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  // タッチ端末ではドロップダウンを抑止しない（06_ui §6.1）。
  // SSRとの hydration mismatch を避けるためマウント後に判定する
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-option-${i}`;

  const candidates =
    query.trim() === ""
      ? []
      : searchChampions(query, lane).filter((c) => !excludeIds.includes(c.id));
  // 変換中はドロップダウンを出さない（タッチ端末を除く。06_ui §6.1）
  const open = focused && query.trim() !== "" && (!composing || coarsePointer);
  // 候補が減っても範囲外を指さないようクランプする
  const activeSafeIndex = Math.min(activeIndex, Math.max(candidates.length - 1, 0));
  // ドロップダウンを隠している間だけ件数で補う
  const countLabel = composing && !open && query.trim() !== "" ? `候補 ${candidates.length}件` : "";

  const select = (champion: Champion) => {
    onSelect(champion);
    setQuery("");
    setActiveIndex(0);
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
    setComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    setComposing(false);
    // 「確定と同時に開く」を保証する。compositionend と input の発火順序が
    // ブラウザによって異なるため、確定テキストをここでも同期しておく
    setQuery(e.currentTarget.value);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 変換中はキー操作を一切処理しない（06_ui §6.1）。
    // isComposing と keyCode 229 は「どちらかが変換中を示せば変換中」= OR で判定する。
    // AND にすると「確定Enterで isComposing が false になる」ケースを取りこぼし、
    // 変換確定のEnterがチャンピオン選択も実行してしまう。
    // ここで preventDefault を呼んではならない（229 の keydown を止めるとIMEが壊れる）
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === "ArrowDown") {
      if (candidates.length === 0) return;
      e.preventDefault();
      setActiveIndex(Math.min(activeSafeIndex + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      if (candidates.length === 0) return;
      e.preventDefault();
      setActiveIndex(Math.max(activeSafeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // 見えていない候補は選ばない
      if (open && candidates[activeSafeIndex]) select(candidates[activeSafeIndex]);
    } else if (e.key === "Escape") {
      setQuery("");
      setActiveIndex(0);
    }
  };

  return (
    <div className="flex flex-col">
      {selected
        ? label && <span className="mb-3 text-[11px] text-text-muted md:text-[12px]">{label}</span>
        : // ラベル行。変換中の「候補 N件」もここに出す（06_ui §6.1）。
          // 高さを常に確保し、変換中に入力欄がずれてIMEウィンドウが動くのを防ぐ
          (
            <div className={`flex min-h-[15px] items-baseline gap-2 ${label ? "mb-3" : "mb-1.5"}`}>
              {label && (
                <label htmlFor={inputId} className="text-[11px] text-text-muted md:text-[12px]">
                  {label}
                </label>
              )}
              <span
                aria-live="polite"
                className="ml-auto text-[10px] tabular-nums text-text-muted md:text-[10.5px]"
              >
                {countLabel}
              </span>
            </div>
          )}

      {selected ? (
        <div className="flex items-center gap-3 rounded-[2px] border border-border bg-bg px-3.5 py-[11px]">
          <Image
            src={championIconUrl(selected.ddragonId)}
            alt={selected.name.ja}
            width={36}
            height={36}
            className="rounded-[2px] bg-icon-bg"
          />
          <span className="flex flex-col">
            <span className="text-[14px] font-bold leading-[1.3] text-text-hi">
              {selected.name.ja}
            </span>
            <span className="text-[10px] text-text-faint">{selected.name.en}</span>
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label={`${selected.name.ja}の選択を解除`}
            className="ml-auto px-1 text-[15px] text-text-faint hover:text-text-hi"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          <input
            id={inputId}
            type="text"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              open && candidates[activeSafeIndex] ? optionId(activeSafeIndex) : undefined
            }
            aria-label={label ? undefined : "チャンピオン名"}
            onChange={(e) => {
              // 変換中も input イベントは発火する。値を加工すると controlled input の
              // 書き戻しでIMEの変換が壊れるため、e.target.value をそのまま保持する
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="チャンピオン名を入力"
            className={`w-full border border-border bg-bg px-3.5 py-3 text-[13px] text-text-hi outline-none placeholder:text-text-faint focus:border-teal md:text-[14px] ${
              open ? "rounded-t-[2px]" : "rounded-[2px]"
            }`}
          />
          {open && (
            // onMouseDown で input の blur より先に選択を確定させる
            <div
              className="border border-t-0 border-border bg-bg"
              onMouseDown={(e) => e.preventDefault()}
            >
              {/* listbox は option だけを子に持つ（注記・空表示は外に出す） */}
              <div id={listboxId} role="listbox" aria-label="チャンピオン候補">
                {candidates.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    id={optionId(i)}
                    aria-selected={i === activeSafeIndex}
                    onClick={() => select(c)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-[11px] px-3.5 py-2.5 text-left ${
                      i === activeSafeIndex ? "bg-teal/8" : ""
                    }`}
                  >
                    <Image
                      src={championIconUrl(c.ddragonId)}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-[2px] bg-icon-bg"
                    />
                    <span className="flex flex-col">
                      <span
                        className={`text-[13px] font-bold leading-[1.3] ${
                          i === activeSafeIndex ? "text-text-hi" : "text-text-body"
                        }`}
                      >
                        {c.name.ja}
                      </span>
                      <span className="text-[10px] text-text-faint">{c.name.en}</span>
                    </span>
                    {i === activeSafeIndex && (
                      <span className="ml-auto text-[10px] text-teal">選択</span>
                    )}
                  </button>
                ))}
              </div>
              {candidates.length === 0 && (
                <p className="px-3.5 py-2.5 text-[12px] text-text-faint">
                  該当するチャンピオンがいません
                </p>
              )}
              <p className="border-t border-border-subtle px-3.5 py-[9px] text-[10px] text-text-faint">
                ひらがな・カタカナ・英語で検索できます
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
