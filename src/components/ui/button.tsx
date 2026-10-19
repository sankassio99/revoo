import * as React from "react";
import Link from "next/link";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { IconLoader2 } from "@tabler/icons-react";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button relative inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-[15px] font-normal whitespace-nowrap transition-[background-color,color,transform] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:bg-stone-soft disabled:text-muted disabled:opacity-100 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-ink/90",
        outline: "border-line bg-surface text-ink hover:bg-canvas",
        secondary: "bg-secondary text-secondary-foreground hover:bg-stone-soft",
        ghost: "bg-transparent text-ink hover:bg-muted/15",
        destructive: "bg-danger text-white hover:bg-danger-deep",
        link: "min-h-0 rounded-none text-primary underline-offset-4 hover:underline",
        accent: "bg-brand text-white hover:bg-brand-hover",
      },
      size: {
        default: "h-11 gap-2 px-5",
        xs: "h-8 min-h-8 gap-1.5 px-3 text-xs after:absolute after:-inset-y-1.5 after:content-['']",
        sm: "h-9 min-h-9 gap-1.5 px-4 text-[13px] after:absolute after:-inset-y-1 after:content-['']",
        lg: "h-[52px] gap-2.5 px-6 text-base",
        icon: "size-11 min-h-11 rounded-full p-0 [&_svg]:size-5",
        "icon-xs": "size-8 min-h-8 rounded-full p-0 after:absolute after:-inset-1.5 after:content-[''] [&_svg]:size-3.5",
        "icon-sm": "size-9 min-h-9 rounded-full p-0 after:absolute after:-inset-y-1 after:content-[''] [&_svg]:size-4",
        "icon-lg": "size-12 min-h-12 rounded-full p-0 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonProps = Omit<ButtonPrimitive.Props, "children"> &
  ButtonVariantProps & {
    children?: React.ReactNode;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loading?: boolean;
    href?: string;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  href,
  children,
  ...props
}: ButtonProps) {
  const content = (
    <>
      {loading ? <IconLoader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" stroke={1.5} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );
  const classes = cn(buttonVariants({ variant, size, className }));

  if (href) {
    return (
      <ButtonPrimitive
        {...props}
        render={<Link href={href} />}
        data-slot="button"
        className={classes}
        aria-disabled={disabled || loading || undefined}
        tabIndex={disabled || loading ? -1 : props.tabIndex}
        onClick={disabled || loading ? (event) => event.preventDefault() : props.onClick}
      >
        {content}
      </ButtonPrimitive>
    );
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
