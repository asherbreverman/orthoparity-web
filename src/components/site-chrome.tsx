import { Link, useLocation, useSearch } from '@tanstack/react-router';
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from './brand-mark';

type Section = 'part' | 'product' | 'company' | 'categories' | 'procedures';

function ToolDescriptions() {
  return <>
    <Link to="/" search={{ level: 'product', compare: '' }} role="menuitem"><b>Compare</b><span>2 to 50 products, two companies or a list of parts</span></Link>
    <Link to="/team" role="menuitem"><b>TEAM lookup</b><span>Hospitals in TEAM and 2027 target prices</span></Link>
    <Link to="/team/calculator" role="menuitem"><b>TEAM calculator</b><span>Arithmetic for a claimed episode saving</span></Link>
    <Link to="/packet-check" search={{}} role="menuitem"><b>Packet check</b><span>A vendor claim next to the public record</span></Link>
    <Link to="/corrections" role="menuitem"><b>Corrections</b><span>What we fixed and when</span></Link>
    <Link to="/updates" role="menuitem"><b>Release notes</b><span>What changed in each data release</span></Link>
    <Link to="/glossary" role="menuitem"><b>Glossary</b><span>Plain-English FDA and CMS terms</span></Link>
  </>;
}

function MobileLinks({ current, onNavigate }: { current: (section: Section) => boolean; onNavigate: () => void }) {
  return <nav className="op-mobile-links" aria-label="Mobile navigation" onClick={onNavigate}>
    <Link to="/" search={{ level: 'part' }} aria-current={current('part') ? 'page' : undefined}>Parts</Link>
    <Link to="/" search={{ level: 'product' }} aria-current={current('product') ? 'page' : undefined}>Products</Link>
    <Link to="/" search={{ level: 'company' }} aria-current={current('company') ? 'page' : undefined}>Companies</Link>
    <Link to="/browse" aria-current={current('categories') ? 'page' : undefined}>Categories</Link>
    <Link to="/procedures" aria-current={current('procedures') ? 'page' : undefined}>Procedures</Link>
    <Link to="/" search={{ level: 'product', compare: '' }}>Compare</Link>
    <Link to="/team">TEAM lookup</Link>
    <Link to="/team/calculator">TEAM calculator</Link>
    <Link to="/packet-check" search={{}}>Packet check</Link>
    <Link to="/corrections">Corrections</Link>
    <Link to="/updates">Release notes</Link>
    <Link to="/glossary">Glossary</Link>
  </nav>;
}

export function SiteHeader() {
  const location = useLocation();
  const search = useSearch({ strict: false }) as { k?: string; v?: string; mode?: string; part?: string; level?: string; compare?: string };
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const toolsButton = useRef<HTMLButtonElement>(null);
  const toolsMenu = useRef<HTMLDivElement>(null);
  const selected = !!search.k || !!search.v || !!search.part;

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const measure = () => document.documentElement.style.setProperty('--record-header-height', `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--record-header-height'); };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    let saved: string | null = null;
    try { saved = localStorage.getItem('orthoparity-theme'); } catch {}
    setDark(saved ? saved === 'dark' : preference.matches);
    setReady(true);
    const update = () => {
      try { if (!localStorage.getItem('orthoparity-theme')) setDark(preference.matches); } catch { setDark(preference.matches); }
    };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => { if (ready) document.documentElement.classList.toggle('dark', dark); }, [dark, ready]);
  useEffect(() => { setToolsOpen(false); setMobileOpen(false); }, [location.pathname, location.searchStr]);

  useEffect(() => {
    if (!toolsOpen && !mobileOpen) return;
    const outside = (event: PointerEvent) => {
      if (toolsOpen && !tools.current?.contains(event.target as Node)) setToolsOpen(false);
      if (mobileOpen && !header.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setToolsOpen(false);
      setMobileOpen(false);
      if (toolsOpen) toolsButton.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [toolsOpen, mobileOpen]);

  function theme() {
    setDark(!dark);
    try { localStorage.setItem('orthoparity-theme', dark ? 'light' : 'dark'); } catch {}
  }

  function current(section: Section) {
    if (section === 'categories') return location.pathname.startsWith('/browse');
    if (section === 'procedures') return location.pathname.startsWith('/procedures');
    if (location.pathname !== '/' || !selected || search.compare !== undefined) return false;
    if (search.part && !search.k) return section === 'part';
    if (search.v || search.mode === 'vendor' || search.level === 'company') return section === 'company';
    if (search.level === 'part') return section === 'part';
    return section === 'product';
  }

  function focusTool(index: number) {
    requestAnimationFrame(() => toolsMenu.current?.querySelectorAll<HTMLAnchorElement>('a')[index]?.focus());
  }

  function openTools(last = false) {
    setToolsOpen(true);
    focusTool(last ? 6 : 0);
  }

  function toolKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(toolsMenu.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      setToolsOpen(false);
      toolsButton.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + direction + items.length) % items.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  }

  const toolActive = ['/team', '/packet-check', '/corrections', '/updates', '/glossary'].some(path => location.pathname.startsWith(path)) || (selected && location.pathname === '/' && search.compare !== undefined);

  return <><header ref={header} className="op-header no-print">
    <div className="op-wrap op-header-main">
      <Link to="/" search={{}} className="op-logo" aria-label="OrthoParity home" onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>
        <BrandMark />
        <span className="op-wordmark">Ortho<span>Parity</span></span>
        <span className="op-tagline">Orthopedic device and vendor benchmarks</span>
      </Link>
      <div className="op-header-actions">
        <nav className="op-nav" aria-label="Main navigation">
          <Link to="/" search={{ level: 'part' }} aria-current={current('part') ? 'page' : undefined}>Parts</Link>
          <Link to="/" search={{ level: 'product' }} aria-current={current('product') ? 'page' : undefined}>Products</Link>
          <Link to="/" search={{ level: 'company' }} aria-current={current('company') ? 'page' : undefined}>Companies</Link>
          <Link to="/browse" aria-current={current('categories') ? 'page' : undefined}>Categories</Link>
          <Link to="/procedures" aria-current={current('procedures') ? 'page' : undefined}>Procedures</Link>
          <div className="op-tools" ref={tools}>
            <button ref={toolsButton} type="button" className="op-navbtn" aria-haspopup="menu" aria-current={toolActive ? 'page' : undefined} aria-expanded={toolsOpen} aria-controls="tools-menu" onClick={() => setToolsOpen(open => !open)} onKeyDown={event => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openTools(event.key === 'ArrowUp'); }
            }}>Tools <ChevronDown size={14} aria-hidden="true" /></button>
            {toolsOpen && <div id="tools-menu" className="op-menu" role="menu" ref={toolsMenu} onKeyDown={toolKeys}><ToolDescriptions /></div>}
          </div>
        </nav>
        <button type="button" className="op-iconbtn op-theme" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={theme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button type="button" className="op-iconbtn op-burger" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(open => !open)}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </div>
    {mobileOpen && <div id="mobile-navigation" className="op-mobile-menu"><div className="op-wrap"><MobileLinks current={current} onNavigate={() => setMobileOpen(false)} /></div></div>}
  </header>{selected && <div className="op-header-search no-print"><div className="op-wrap"><div id="docked-search" className="docked-search" /></div></div>}</>;
}

export function SiteFooter({ onMethodology, methodologyOpen }: { onMethodology: () => void; methodologyOpen: boolean }) {
  return <footer className="op-footer no-print">
    <div className="op-wrap">
      <div className="op-footer-cols">
        <div><b>Benchmark</b><Link to="/" search={{ level: 'part' }}>Parts</Link><Link to="/" search={{ level: 'product' }}>Products</Link><Link to="/" search={{ level: 'company' }}>Companies</Link><Link to="/" search={{ level: 'product', compare: '' }}>Compare</Link></div>
        <div><b>Explore</b><Link to="/browse">Browse by category</Link><Link to="/procedures">Medicare by procedure</Link><Link to="/team">TEAM lookup</Link><Link to="/packet-check" search={{}}>Packet check</Link></div>
        <div><b>Trust</b><Link to="/corrections">Corrections</Link><Link to="/updates">Release notes</Link><button type="button" className="op-footer-link" onClick={onMethodology} aria-expanded={methodologyOpen} aria-controls="about-limitations">Methodology</button><Link to="/glossary">Glossary</Link><a href="https://github.com/asherbreverman/orthoparity-data" target="_blank" rel="noopener noreferrer">Source code (GitHub)</a></div>
        <div><b>About</b><span>Free, open source, MIT</span><span>No vendor funding, no ads</span><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link></div>
      </div>
      <p className="op-footer-legal">OrthoParity never asks for your prices or your data. You bring them to the table, not to the website. Independent research tool built from public FDA and CMS data, provided as is. Not affiliated with FDA or CMS. Not regulatory or compliance advice. Open source under the MIT License, © 2026 Asher Breverman.</p>
    </div>
  </footer>;
}
