"use client";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cn } from "cn";
function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props}/>;
}
function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
    return (<CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props}/>);
}
function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
    return (<CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" className={cn("overflow-hidden duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0", className)} {...props}/>);
}
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
