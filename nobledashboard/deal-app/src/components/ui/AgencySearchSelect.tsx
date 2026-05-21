'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';

export interface AgencyOption {
  code: string;
  name: string;
}

interface AgencySearchSelectProps {
  /** 選択中の agency_code */
  value: string;
  /** 選択変更時のコールバック */
  onChange: (code: string) => void;
  /** 代理店リスト */
  agencies: AgencyOption[];
  /** 未選択時のプレースホルダー */
  placeholder?: string;
  /** Tailwind クラス（外側 wrapper に適用） */
  className?: string;
  /** エラー状態 */
  hasError?: boolean;
  /** disabled */
  disabled?: boolean;
}

/**
 * 検索機能付き代理店選択コンポーネント
 *
 * - プルダウンを開くと上部に検索入力欄を表示
 * - 入力に応じて候補をリアルタイム絞り込み（部分一致）
 * - キーボード操作: ↑↓ で候補移動、Enter で確定、Escape で閉じる
 * - 候補がない場合は「該当する代理店がありません」を表示
 */
export default function AgencySearchSelect({
  value,
  onChange,
  agencies,
  placeholder = '-- 選択してください --',
  className = '',
  hasError = false,
  disabled = false,
}: AgencySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 選択中の代理店名を取得
  const selectedAgency = agencies.find((a) => a.code === value);
  const displayLabel = selectedAgency ? selectedAgency.name : placeholder;

  // 絞り込み結果
  const filtered = searchQuery.trim()
    ? agencies.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : agencies;

  // ドロップダウンを開く
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(-1);
    // 少し待ってから検索欄にフォーカス
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [disabled]);

  // ドロップダウンを閉じる
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, []);

  // 項目を選択
  const selectItem = useCallback(
    (code: string) => {
      onChange(code);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  // 外側クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // ハイライト項目をスクロールして表示
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // キーボード操作（検索入力欄）
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          selectItem(filtered[highlightedIndex].code);
        }
        break;
      case 'Escape':
        closeDropdown();
        break;
    }
  };

  // キーボード操作（トリガーボタン）
  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openDropdown();
    }
  };

  const borderClass = hasError ? 'border-red-500' : 'border-gray-300';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* トリガーボタン（既存 select と同じ見た目） */}
      <button
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-3 py-2 border ${borderClass} rounded-lg
          text-sm bg-white text-left
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${selectedAgency ? 'text-gray-900' : 'text-gray-400'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        {/* シェブロン */}
        <svg
          className={`ml-2 h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* 検索入力欄 */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="代理店名を検索..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="代理店を検索"
              />
            </div>
          </div>

          {/* 候補リスト */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {/* 未選択オプション */}
            {!searchQuery && (
              <li
                role="option"
                aria-selected={value === ''}
                onClick={() => selectItem('')}
                className={`
                  px-3 py-2 text-sm cursor-pointer select-none
                  ${value === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}
                `}
              >
                {placeholder}
              </li>
            )}

            {/* 絞り込み結果 */}
            {filtered.length > 0 ? (
              filtered.map((agency, index) => {
                const isSelected = agency.code === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={agency.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectItem(agency.code)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-3 py-2 text-sm cursor-pointer select-none
                      ${isHighlighted ? 'bg-blue-100 text-blue-900' : ''}
                      ${isSelected && !isHighlighted ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                      ${!isSelected && !isHighlighted ? 'text-gray-900 hover:bg-gray-50' : ''}
                    `}
                  >
                    {/* 検索ワードをハイライト */}
                    {searchQuery
                      ? highlightMatch(agency.name, searchQuery)
                      : agency.name}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">
                該当する代理店がありません
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 検索ワードに一致する部分を <mark> でハイライトして返す
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
