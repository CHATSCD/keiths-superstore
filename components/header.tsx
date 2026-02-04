"use client";

import { Store } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-tight text-foreground">
            {"Keith's Superstore"}
          </h1>
          {title && (
            <span className="text-xs text-muted-foreground">{title}</span>
          )}
        </div>
      </div>
    </header>
  );
}
