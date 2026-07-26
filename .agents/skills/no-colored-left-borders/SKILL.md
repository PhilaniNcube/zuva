---
name: no-colored-left-borders
description: Enforces visual styling rules against using colored left borders on buttons, cards, sidebar items, badges, alerts, or interactive UI elements.
---

# No Colored Left Borders Rule

When designing or styling components in the ZUVA Scholar Hub (buttons, cards, badges, sidebars, tabs, alerts, or containers):

- **Avoid Colored Left Borders**: Do NOT use accent left borders such as `border-l-2`, `border-l-4`, `border-l-primary`, `border-l-amber-500`, or `border-l-*`.
- **Preferred Selection Indicators**:
  - Active buttons / sidebar items: Use subtle background fills (`bg-primary/10`, `bg-sidebar-accent`), font weight changes (`font-semibold`), or rounded background highlights.
  - Active tabs: Use bottom borders (`border-b-2 border-primary`) or pill toggles.
  - Cards & Containers: Use uniform 1px borders (`border border-border/70`), glassmorphic fills (`bg-card/95`), or subtle ambient shadows.
  - Callouts / Alerts: Use full soft background fills with colored icons and text rather than thick left border stripes.
