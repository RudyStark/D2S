import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

interface CommonProps {
  variant?: Variant;
  size?: "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

type LinkButtonProps = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type ActionButtonProps = CommonProps & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

/** CTA: real <a> or <button>, arrow nudges on hover. */
export function Button(props: LinkButtonProps | ActionButtonProps) {
  const { variant = "primary", size = "md", icon, children, className, ...rest } = props;
  const cls = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as LinkButtonProps;
    return (
      <Link href={href} className={cls} {...linkRest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as Omit<ActionButtonProps, keyof CommonProps>)}>
      {content}
    </button>
  );
}
