"use client"

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { articles, DocArticle } from '@/lib/docs-db'

/* ------------------------------------------------------------------ */
/*  Reusable Sub-Components & Renderer                               */
/* ------------------------------------------------------------------ */

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{
        fontSize: '11px',
        fontFamily: 'var(--font-jetbrains-mono)',
        color: copied ? '#10b981' : '#71717a',
        background: '#161618',
        border: '1px solid #27272a',
        borderRadius: '6px',
        padding: '4px 10px',
        cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const CodePanel = ({ code, language }: { code: string; language: string }) => (
  <div style={{ margin: '24px 0', borderRadius: '12px', border: '1px solid #1e1e1e', background: '#070708', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #1e1e1e', background: '#0c0c0e' }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-mono)', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{language}</span>
      <CopyButton text={code} />
    </div>
    <pre style={{ padding: '16px', overflowX: 'auto', fontSize: '13px', lineHeight: 1.7, color: '#d4d4d8', fontFamily: 'var(--font-jetbrains-mono)', margin: 0 }}>
      <code>{code}</code>
    </pre>
  </div>
)

const Alert = ({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) => {
  const cfg = {
    tip: { border: '#10b981', bg: 'rgba(16,185,129,.06)', color: '#10b981', label: 'TIP', icon: '💡' },
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,.06)', color: '#f59e0b', label: 'WARNING', icon: '⚠️' },
    info: { border: '#6798ff', bg: 'rgba(103,152,255,.06)', color: '#6798ff', label: 'NOTE', icon: 'ℹ️' }
  }[type]
  return (
    <div style={{ display: 'flex', gap: '12px', margin: '24px 0', padding: '16px', borderRadius: '12px', border: `1px solid ${cfg.border}33`, background: cfg.bg }}>
      <span style={{ fontSize: '16px', lineHeight: 1, userSelect: 'none', marginTop: '2px' }}>{cfg.icon}</span>
      <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#a1a1aa', fontFamily: 'var(--font-inter)' }}>
        <strong style={{ display: 'block', marginBottom: '4px', color: cfg.color, fontFamily: 'var(--font-jetbrains-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{cfg.label}</strong>
        {children}
      </div>
    </div>
  )
}

/* ---- Reusable heading styles ---- */
const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '20px',
  fontWeight: 600,
  color: '#f8fafc',
  marginTop: '48px',
  marginBottom: '16px',
  paddingLeft: '12px',
  borderLeft: '2px solid rgba(103,152,255,.5)',
  lineHeight: 1.35,
}

const h3Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '16px',
  fontWeight: 600,
  color: '#f8fafc',
  marginTop: '28px',
  marginBottom: '12px',
  lineHeight: 1.4,
}

const pStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '15px',
  lineHeight: 1.75,
  color: '#a1a1aa',
  marginBottom: '20px'
}

/* ------------------------------------------------------------------ */
/*  Inline Markdown Parser / Renderer                                 */
/* ------------------------------------------------------------------ */

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let currentText = text
  let index = 0

  while (currentText.length > 0) {
    const codeMatch = currentText.match(/`([^`]+)`/)
    const boldMatch = currentText.match(/\*\*([^*]+)\*\*/)
    const linkMatch = currentText.match(/\[([^\]]+)\]\(([^)]+)\)/)

    let firstMatch: { type: 'code' | 'bold' | 'link'; index: number; length: number; content: string; extra?: string } | null = null

    if (codeMatch && codeMatch.index !== undefined) {
      firstMatch = { type: 'code', index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[1] }
    }

    if (boldMatch && boldMatch.index !== undefined && (firstMatch === null || boldMatch.index < firstMatch.index)) {
      firstMatch = { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, content: boldMatch[1] }
    }

    if (linkMatch && linkMatch.index !== undefined && (firstMatch === null || linkMatch.index < firstMatch.index)) {
      firstMatch = { type: 'link', index: linkMatch.index, length: linkMatch[0].length, content: linkMatch[1], extra: linkMatch[2] }
    }

    if (firstMatch === null) {
      elements.push(<span key={index++}>{currentText}</span>)
      break
    }

    if (firstMatch.index > 0) {
      elements.push(<span key={index++}>{currentText.substring(0, firstMatch.index)}</span>)
    }

    if (firstMatch.type === 'code') {
      elements.push(
        <code key={index++} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '13px', background: '#161618', padding: '2px 6px', borderRadius: '4px', color: '#d4d4d8', border: '1px solid #27272a' }}>
          {firstMatch.content}
        </code>
      )
    } else if (firstMatch.type === 'bold') {
      elements.push(<strong key={index++} style={{ color: '#f8fafc', fontWeight: 600 }}>{firstMatch.content}</strong>)
    } else if (firstMatch.type === 'link') {
      elements.push(
        <a key={index++} href={firstMatch.extra} style={{ color: '#0044ff', textDecoration: 'none', borderBottom: '1px dotted #0044ff' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#0044ff'}>
          {firstMatch.content}
        </a>
      )
    }

    currentText = currentText.substring(firstMatch.index + firstMatch.length)
  }

  return elements
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const blocks: React.ReactNode[] = []
  const parts = content.split('```')

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const codePart = parts[i]
      const lines = codePart.split('\n')
      const language = lines[0].trim() || 'go'
      const codeContent = lines.slice(1).join('\n').trim()
      blocks.push(<CodePanel key={`code-${i}`} code={codeContent} language={language} />)
    } else {
      const textPart = parts[i]
      const lines = textPart.split('\n')

      let inList = false
      let listItems: string[] = []
      let inTable = false
      let tableRows: string[][] = []

      const flushList = (key: string) => {
        if (listItems.length > 0) {
          blocks.push(
            <ul key={key} style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.75, color: '#a1a1aa', paddingLeft: '20px', listStyleType: 'disc', marginBottom: '24px' }}>
              {listItems.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          )
          listItems = []
        }
      }

      const flushTable = (key: string) => {
        if (tableRows.length > 0) {
          const headers = tableRows[0]
          const bodyRows = tableRows.slice(2)
          blocks.push(
            <div key={key} style={{ overflowX: 'auto', margin: '24px 0', border: '1px solid #1e1e1e', borderRadius: '12px', background: '#070708' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#a1a1aa' }}>
                <thead>
                  <tr style={{ background: '#0c0c0e', borderBottom: '1px solid #1e1e1e' }}>
                    {headers.map((h, idx) => (
                      <th key={idx} style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-inter)' }}>
                        {renderInlineMarkdown(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: rIdx < bodyRows.length - 1 ? '1px solid #1e1e1e' : 'none', background: rIdx % 2 === 0 ? 'transparent' : '#0a0a0c' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '14px 16px', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          tableRows = []
        }
      }

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim()

        if (line.startsWith('|') && line.endsWith('|')) {
          flushList(`list-before-table-${i}-${j}`)
          inList = false
          inTable = true
          const cells = line.split('|').slice(1, -1).map(c => c.trim())
          tableRows.push(cells)
        } else if (line.startsWith('## ')) {
          flushList(`list-before-h2-${i}-${j}`)
          inList = false
          flushTable(`table-before-h2-${i}-${j}`)
          inTable = false
          const text = line.substring(3).trim()
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          blocks.push(<h2 id={id} key={`h2-${i}-${j}`} style={h2Style}>{text}</h2>)
        } else if (line.startsWith('### ')) {
          flushList(`list-before-h3-${i}-${j}`)
          inList = false
          flushTable(`table-before-h3-${i}-${j}`)
          inTable = false
          const text = line.substring(4).trim()
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          blocks.push(<h3 id={id} key={`h3-${i}-${j}`} style={h3Style}>{text}</h3>)
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          flushTable(`table-before-list-${i}-${j}`)
          inTable = false
          inList = true
          listItems.push(line.substring(2).trim())
        } else if (line === '---') {
          flushList(`list-before-hr-${i}-${j}`)
          inList = false
          flushTable(`table-before-hr-${i}-${j}`)
          inTable = false
          blocks.push(<hr key={`hr-${i}-${j}`} style={{ border: 'none', borderBottom: '1px solid #1e1e1e', margin: '32px 0' }} />)
        } else if (line === '') {
          flushList(`list-before-empty-${i}-${j}`)
          inList = false
          flushTable(`table-before-empty-${i}-${j}`)
          inTable = false
        } else {
          if (inList) {
            listItems[listItems.length - 1] += ' ' + line
          } else if (inTable) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim())
            tableRows.push(cells)
          } else {
            blocks.push(<p key={`p-${i}-${j}`} style={pStyle}>{renderInlineMarkdown(line)}</p>)
          }
        }
      }
      flushList(`list-end-${i}`)
      flushTable(`table-end-${i}`)
    }
  }

  return <>{blocks}</>
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  const params = useParams()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Resolve the active article ID from the catch-all dynamic route segment
  const activeId = useMemo(() => {
    if (params && params.slug) {
      const slugArray = params.slug
      const slug = Array.isArray(slugArray) ? slugArray[0] : slugArray
      return slug
    }
    return articles[0]?.id || ''
  }, [params])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const filtered = useMemo(() => articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  ), [search])

  const active = useMemo(() => {
    return articles.find(a => a.id === activeId) || articles[0]
  }, [activeId])

  const grouped = useMemo(() => {
    const g: Record<string, DocArticle[]> = {}
    filtered.forEach(a => { (g[a.category] ??= []).push(a) })
    return g
  }, [filtered])

  /* ---------------------------------------------------------------- */
  /*  Styles System Config                                            */
  /* ---------------------------------------------------------------- */
  const PAGE_BG = '#000000'
  const BORDER = '#1e1e1e'
  const SURFACE_CARD = '#161618'
  const SURFACE_BORDER = '#27272a'
  const TEXT_DIM = '#71717a'
  const TEXT_BODY = '#a1a1aa'
  const TEXT_WHITE = '#ffffff'
  const ACCENT = '#0044ff'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: PAGE_BG, color: TEXT_BODY, fontFamily: 'var(--font-inter)', display: 'flex', flexDirection: 'column' }}>

      {/* ===== TOP HEADER BAR ===== */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)', position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 100 }}>
        <div className="docs-header-container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <img src="/logo/logo.svg" alt="Wyre" style={{ width: '28px', height: '28px' }} />
              <span style={{ color: TEXT_WHITE, fontWeight: 600, fontSize: '16px', letterSpacing: '-0.3px' }}>Wyre</span>
            </Link>
            <span style={{ color: ACCENT, fontFamily: "'Pixelify Sans', 'VT323', monospace", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>DOCS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: '12px', color: TEXT_DIM }}>
            <div className="version-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
              <span>v0.1.0 Stable</span>
            </div>
            <a href="https://github.com/crossxr/wyre" target="_blank" rel="noopener noreferrer" style={{ color: TEXT_DIM, fontSize: '18px', display: 'flex', alignItems: 'center' }}><i className="hn hn-github"></i></a>
          </div>
        </div>
      </header>

      {/* ===== MOBILE SUB-HEADER ===== */}
      <div className="docs-mobile-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '48px', borderBottom: `1px solid ${BORDER}`, backgroundColor: 'rgba(12,12,14,.9)', backdropFilter: 'blur(12px)', position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 90 }}>
        <button onClick={() => setDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-jetbrains-mono)', color: ACCENT, background: SURFACE_CARD, border: `1px solid ${SURFACE_BORDER}`, borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          Menu
        </button>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains-mono)', color: ACCENT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{active.title}</span>
      </div>

      {/* ===== 3-COLUMN LAYOUT ===== */}
      <div className="docs-layout-container" style={{ flex: 1, display: 'flex', gap: '0', position: 'relative', width: '100%' }}>

        {/* Mobile drawer overlay */}
        {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />}

        {/* ===== LEFT SIDEBAR ===== */}
        <aside className={`docs-sidebar${drawerOpen ? ' docs-sidebar-open' : ''}`} style={{
          paddingTop: '32px', paddingBottom: '32px',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {/* Mobile sidebar header */}
          <div className="mobile-only-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}`, marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo/logo.svg" alt="Wyre" style={{ width: '20px', height: '20px' }} />
              <span style={{ color: TEXT_WHITE, fontWeight: 600, fontSize: '14px' }}>Documentation</span>
            </div>
            <button onClick={() => setDrawerOpen(false)} style={{ background: '#1c1c1f', border: `1px solid ${SURFACE_BORDER}`, borderRadius: '4px', color: TEXT_BODY, fontSize: '11px', fontFamily: 'var(--font-jetbrains-mono)', padding: '4px 8px', cursor: 'pointer' }}>Close</button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TEXT_DIM }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              type="text" placeholder="Search docs..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '36px', borderRadius: '8px', background: SURFACE_CARD, border: `1px solid ${SURFACE_BORDER}`, color: TEXT_WHITE, fontFamily: 'var(--font-inter)', fontSize: '13px', outline: 'none' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--font-jetbrains-mono)', color: TEXT_DIM, background: '#1c1c1f', border: `1px solid ${SURFACE_BORDER}`, padding: '1px 5px', borderRadius: '3px', userSelect: 'none' }}>/</span>
          </div>

          {/* Menu Groups */}
          {Object.keys(grouped).length === 0 ? (
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains-mono)', color: TEXT_DIM, textAlign: 'center', fontStyle: 'italic', marginTop: '16px' }}>No matching articles</p>
          ) : Object.entries(grouped).map(([cat, list]) => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px', paddingLeft: '12px' }}>{cat}</span>
              {list.map(a => (
                <Link key={a.id} href={`/docs/${a.id}`} onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left',
                    padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'all .15s ease',
                    fontFamily: 'var(--font-inter)', border: activeId === a.id ? `1px solid ${SURFACE_BORDER}` : '1px solid transparent',
                    background: activeId === a.id ? SURFACE_CARD : 'transparent', textDecoration: 'none',
                    color: activeId === a.id ? TEXT_WHITE : TEXT_BODY, fontWeight: activeId === a.id ? 500 : 400,
                  }}>
                  <span>{a.title}</span>
                  {activeId === a.id && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ACCENT }} />}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        {/* ===== CENTER ARTICLE PANEL ===== */}
        <main className="docs-main" style={{ flex: 1, minWidth: 0 }}>
          <article style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* Header Block */}
            <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: '16px', marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-mondwest)', fontSize: '36px', fontWeight: 600, color: TEXT_WHITE, letterSpacing: '-1px', margin: 0 }}>{active.title}</h1>
            </div>
            {/* Body */}
            <MarkdownRenderer content={active.content} />
          </article>
        </main>

        {/* ===== RIGHT TABLE OF CONTENTS ===== */}
        <aside className="docs-toc" style={{ paddingTop: '40px', overflowY: 'auto' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '16px' }}>On this page</span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {active.headings.map(h => (
              <li key={h.id}>
                <a href={`#${h.id}`} onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ fontSize: '12px', color: TEXT_BODY, fontFamily: 'var(--font-inter)', textDecoration: 'none', transition: 'color .15s ease', display: 'block' }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = TEXT_BODY)}
                >{h.label}</a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Responsive overrides via a style tag — avoids Tailwind compilation issues entirely */}
      <style>{`
        /* Custom Scrollbar Styles */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #000000;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #0044ff;
        }
        .docs-sidebar a:hover {
          color: #0044ff !important;
        }
        html, .docs-sidebar, .docs-toc {
          scrollbar-width: thin;
          scrollbar-color: #27272a #000000;
        }

        .docs-header-container {
          width: 100%;
          max-width: 100% !important;
          padding: 0 40px !important;
          margin: 0 !important;
        }
        .docs-layout-container {
          width: 100%;
          max-width: 100% !important;
          padding-top: 64px !important;
          margin: 0 !important;
        }
        .docs-sidebar {
          position: fixed !important;
          top: 64px !important;
          left: 0 !important;
          width: 280px !important;
          height: calc(100vh - 64px) !important;
          padding-left: 40px !important;
          padding-right: 24px !important;
          border-right: 1px solid #1e1e1e !important;
          background: #000000;
          overflow-y: auto;
          z-index: 90;
        }
        .docs-main {
          margin-left: 280px !important;
          margin-right: 240px !important;
          padding: 40px 48px !important;
        }
        .docs-toc {
          position: fixed !important;
          top: 64px !important;
          right: 0 !important;
          width: 240px !important;
          height: calc(100vh - 64px) !important;
          padding-left: 24px !important;
          padding-right: 40px !important;
          border-left: 1px solid #1e1e1e !important;
          background: #000000;
          overflow-y: auto;
          z-index: 90;
        }

        @media (max-width: 1024px) {
          .docs-toc { display: none !important; }
          .docs-main {
            margin-right: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .docs-header-container {
            padding: 0 16px !important;
          }
          .docs-layout-container {
            padding-top: 112px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .docs-main {
            margin-left: 0 !important;
            padding: 24px 16px !important;
          }
          .version-badge {
            display: none !important;
          }
          .docs-mobile-bar { display: flex !important; }
          .mobile-only-header { display: flex !important; }
          .docs-sidebar {
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important; 
            bottom: 0 !important;
            height: 100% !important;
            z-index: 210 !important; 
            width: 280px !important; 
            min-width: 280px !important;
            background: #0a0a0c !important; 
            border-right: 1px solid #1e1e1e !important;
            padding: 24px !important; 
            transform: translateX(-100%); 
            transition: transform .2s ease;
          }
          .docs-sidebar-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  )
}
