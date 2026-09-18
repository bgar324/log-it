"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";
function Tabs({ className, orientation = "horizontal", ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (<TabsPrimitive.Root data-slot="tabs" data-orientation={orientation} className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)} {...props}/>);
}
const tabsListVariants = cva("group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none", {
    variants: {
        variant: {
            default: "bg-muted",
            line: "gap-1 bg-transparent",
            card: "gap-2 bg-transparent",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
function TabsList({ className, variant = "default", activeValue, children, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants> & {
    activeValue?: string;
}) {
    const listRef = React.useRef<HTMLDivElement>(null);
    const indicatorRef = React.useRef<HTMLSpanElement>(null);
    const previousValue = React.useRef(activeValue);
    const liquidAnimation = React.useRef<Animation | null>(null);
    const [indicator, setIndicator] = React.useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    React.useLayoutEffect(() => {
        const list = listRef.current;
        if (variant !== "card" || !list)
            return;
        const update = () => {
            const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
            if (!active)
                return;
            const parent = list.getBoundingClientRect();
            const target = active.getBoundingClientRect();
            const next = { x: target.left - parent.left, y: target.top - parent.top, width: target.width, height: target.height };
            setIndicator(previous => previous && previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height ? previous : next);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(list);
        list.querySelectorAll('[role="tab"]').forEach(tab => observer.observe(tab));
        return () => observer.disconnect();
    }, [activeValue, variant]);
    React.useLayoutEffect(() => {
        const changed = previousValue.current !== activeValue;
        previousValue.current = activeValue;
        const element = indicatorRef.current;
        if (!changed || !element)
            return;
        const currentTransform = getComputedStyle(element).transform;
        liquidAnimation.current?.cancel();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        liquidAnimation.current = element.animate([
            { transform: currentTransform === "none" ? "scaleY(1)" : currentTransform },
            { transform: "scaleY(0.78)", offset: 0.5 },
            { transform: "scaleY(1)" },
        ], { duration: 360, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
    }, [activeValue]);
    React.useEffect(() => () => liquidAnimation.current?.cancel(), []);
    return (<TabsPrimitive.List ref={listRef} data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), "relative isolate", className)} {...props}>
      {variant === "card" && indicator ? <span ref={indicatorRef} aria-hidden="true" data-slot="tabs-indicator" className="pointer-events-none absolute inset-0 origin-center rounded-lg bg-muted transition-[clip-path] duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[clip-path,transform] motion-reduce:transition-none dark:bg-muted/50" style={{ clipPath: `inset(${indicator.y}px calc(100% - ${indicator.x + indicator.width}px) calc(100% - ${indicator.y + indicator.height}px) ${indicator.x}px round var(--radius-lg))` }}/> : null}
      {children}
    </TabsPrimitive.List>);
}
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (<TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn("relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent", "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground", "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100", "group-data-[variant=card]/tabs-list:rounded-lg group-data-[variant=card]/tabs-list:border-0 group-data-[variant=card]/tabs-list:data-active:bg-transparent group-data-[variant=card]/tabs-list:data-[state=inactive]:hover:bg-muted", "dark:group-data-[variant=card]/tabs-list:data-active:bg-transparent dark:group-data-[variant=card]/tabs-list:data-[state=inactive]:hover:bg-muted/50", className)} {...props}/>);
}
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (<TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 text-sm outline-none", className)} {...props}/>);
}
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
