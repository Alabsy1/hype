"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CompareLink } from "@/components/products/CompareToggle";
import { BagIcon, CloseIcon, HeartIcon, SearchIcon } from "@/components/ui/Icons";
import { logoutAction } from "@/app/login/actions";

/** Safe identity subset the server layout passes down (no secrets, ever). */
export interface HeaderUser {
  name: string | null;
  email: string;
  role: string;
}
import {
  formatPrice,
  getCategoryPath,
  getProductPath,
  searchCatalog,
} from "@/lib/catalog-ui";
import type { Category, Product } from "@/data/types";

const navItems = [
  { label: "Furniture", href: "/furniture" },
  { label: "Decoration", href: "/decoration" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

export interface HeaderSearchIndex {
  products: Product[];
  categories: Category[];
}

export default function Header({
  searchIndex,
  user,
}: {
  searchIndex: HeaderSearchIndex;
  user: HeaderUser | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    const reset = window.setTimeout(() => {
      setMenuOpen(false);
      setSearchOpen(false);
      setQuery("");
    }, 0);
    return () => window.clearTimeout(reset);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAll]);

  useEffect(() => {
    const overlayOpen = menuOpen || searchOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const results = useMemo(
    () =>
      searchCatalog(query, {
        products: searchIndex.products,
        categories: searchIndex.categories,
      }),
    [query, searchIndex],
  );

  const isActive = (href: string) =>
    href === "/furniture" || href === "/decoration"
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  // Render-time convenience only: the /dashboard route itself stays
  // server-side protected regardless of which links are shown.
  const displayName = user ? (user.name?.trim() ? user.name : user.email) : null;

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden border-b border-line/70 bg-canvas/95 lg:block">
        <div className="shell flex h-9 items-center justify-between text-[0.68rem] uppercase tracking-[0.2em] text-muted">
          <p>Made to order in small batches</p>
          <p className="text-accent">Decoration — the new collection</p>
          <p>Complimentary white-glove delivery over $2,000</p>
        </div>
      </div>

      <div className="relative z-50 border-b border-line/70 bg-canvas/88 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-5 xl:gap-6 md:h-20">
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              className="-ml-1 flex h-10 w-10 items-center justify-center lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>

            <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex xl:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`link-underline meta text-ink transition-colors hover:text-accent ${
                    isActive(item.href) ? "text-accent" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/"
            className="group flex items-baseline gap-1 py-2 text-ink"
            aria-label="Hype — home"
          >
            <span className="text-[1.45rem] font-medium uppercase leading-none tracking-[0.3em] transition-colors group-hover:text-accent md:text-[1.7rem]">
              Hype
            </span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-muted md:inline">
              furniture
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1 md:gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
              aria-expanded={searchOpen}
              aria-controls={searchId}
              className="flex h-10 items-center gap-2 px-2 text-ink transition-colors hover:text-accent"
            >
              <SearchIcon />
              <span className="meta hidden xl:inline">Search</span>
            </button>

            <CompareLink className="hidden lg:inline-flex" />

            <button
              type="button"
              aria-label="Wishlist (empty)"
              title="Wishlist — coming in the next release"
              className="hidden h-10 w-10 items-center justify-center text-ink transition-colors hover:text-accent lg:flex"
            >
              <HeartIcon />
            </button>

            <button
              type="button"
              aria-label="Cart (empty)"
              title="Cart — coming in the next release"
              className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-accent"
            >
              <BagIcon />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>

            {user ? (
              <span className="hidden items-center gap-3 lg:flex">
                <Link
                  href="/account"
                  className="link-underline meta max-w-36 truncate text-ink hover:text-accent"
                  title={user.email}
                >
                  {displayName}
                </Link>
                {user.role === "ADMIN" ? (
                  <Link href="/dashboard" className="link-underline meta text-ink hover:text-accent">
                    Dashboard
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="link-underline meta cursor-pointer text-ink hover:text-accent"
                  >
                    Logout
                  </button>
                </form>
              </span>
            ) : (
              <span className="hidden items-center gap-3 lg:flex">
                <Link href="/login" className="link-underline meta text-ink hover:text-accent">
                  Login
                </Link>
                <Link href="/register" className="link-underline meta text-ink hover:text-accent">
                  Sign up
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div
          id={searchId}
          className="border-b border-line bg-canvas shadow-[0_24px_60px_-40px_rgba(25,23,19,0.5)]"
        >
          <div className="shell py-7 md:py-9">
            <div className="flex items-center gap-4 border-b border-line pb-4">
              <SearchIcon className="h-5 w-5 text-muted" />
              <label htmlFor={`${searchId}-input`} className="sr-only">
                Search the collection
              </label>
              <input
                id={`${searchId}-input`}
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search mirrors, sofas, oak, bouclé…"
                className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted/60 md:text-3xl"
              />
              <button
                type="button"
                onClick={closeAll}
                aria-label="Close search"
                className="text-muted transition-colors hover:text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="eyebrow">
                  {query.trim() ? `${results.products.length} pieces` : "Suggested pieces"}
                </p>
                <ul className="mt-4 divide-y divide-line/70">
                  {(query.trim() ? results.products : results.products.slice(0, 4)).length === 0 ? (
                    <li className="py-4 text-sm text-muted">
                      Nothing matches “{query.trim()}”. Try a material like oak or bouclé.
                    </li>
                  ) : (
                    (query.trim() ? results.products : results.products.slice(0, 4)).map(
                      (product) => (
                        <li key={product.slug}>
                          <Link
                            href={getProductPath(product)}
                            className="group flex items-center gap-4 py-3"
                          >
                            <span className="frame relative h-14 w-14 shrink-0">
                              <Image
                                src={product.images[0]}
                                alt=""
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm group-hover:text-accent">
                                {product.name}
                              </span>
                              <span className="meta mt-1 block normal-case tracking-[0.08em]">
                                {product.category.replace(/-/g, " ")} · {product.material.split(",")[0]}
                              </span>
                            </span>
                            <span className="text-sm tabular-nums">
                              {formatPrice(product.price)}
                            </span>
                          </Link>
                        </li>
                      ),
                    )
                  )}
                </ul>
              </div>

              <div>
                <p className="eyebrow">Categories</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(query.trim() ? results.categories : results.categories.slice(0, 6)).map(
                    (category) => (
                      <li key={category.slug}>
                        <Link
                          href={getCategoryPath(category)}
                          className="btn btn-quiet !px-4 !py-2.5"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        id="mobile-navigation"
        aria-label="Mobile"
        className={`fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-canvas transition-transform duration-500 md:top-20 lg:hidden ${
          menuOpen ? "translate-y-0" : "pointer-events-none -translate-y-full"
        }`}
      >
        <ul className="shell flex flex-col gap-1 py-8">
          {navItems.map((item, index) => (
            <li key={item.href} className="border-b border-line/70">
              <Link
                href={item.href}
                className="flex items-baseline justify-between py-5"
                onClick={() => setMenuOpen(false)}
              >
                <span className="display-md">
                  {item.label}
                </span>
                <span className="meta tabular-nums">0{index + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="shell flex flex-col gap-4 pb-16">
          <Link href="/furniture" className="btn btn-solid" onClick={() => setMenuOpen(false)}>
            Explore Furniture
          </Link>
          <Link href="/compare" className="btn btn-quiet" onClick={() => setMenuOpen(false)}>
            Comparison
          </Link>
          {user ? (
            <div className="flex flex-col gap-4 border-t border-line/70 pt-6">
              <Link href="/account" onClick={() => setMenuOpen(false)}>
                <span className="display-md block truncate">{displayName}</span>
                <span className="meta mt-1 block text-muted">{user.email}</span>
              </Link>
              {user.role === "ADMIN" ? (
                <Link href="/dashboard" className="btn btn-quiet" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
              ) : null}
              <form action={logoutAction}>
                <button type="submit" className="btn btn-quiet w-full">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4 border-t border-line/70 pt-6">
              <Link href="/login" className="btn btn-solid" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="btn btn-quiet" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </div>
          )}
          <p className="meta mt-4 normal-case tracking-[0.1em]">
            Hype Furniture — editorial furniture for rooms that are lived in.
          </p>
        </div>
      </nav>
    </header>
  );
}
