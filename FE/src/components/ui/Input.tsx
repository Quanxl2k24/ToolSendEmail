import type { InputHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function InputField({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-5 py-3 rounded-full border border-fog bg-mist text-sm outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-white",
        className,
      )}
      {...rest}
    />
  );
}

export function InputGroup({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex gap-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function InlineInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-2 py-1 rounded border border-midnight-ink text-sm outline-none",
        className,
      )}
      {...rest}
    />
  );
}

export function SearchInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full py-2 pr-4 pl-9 rounded-full border border-fog text-sm outline-none focus:border-midnight-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function EditableInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "text-2xl font-[652] bg-mist rounded-xl focus:bg-white text-midnight-ink border-none border-b-2 border-b-transparent px-2 py-1 outline-none transition-all duration-200 focus:border-b-midnight-ink w-auto min-w-[300px]",
        className,
      )}
      {...rest}
    />
  );
}
