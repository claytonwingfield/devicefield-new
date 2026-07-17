import HeaderClient from "./header-client";
import {
  defaultSitePages,
  getObjectArray,
  getSitePage,
  getString,
  type NavigationEntry,
} from "@/lib/site/pages";

export default async function Header() {
  const page = await getSitePage("global");
  const defaults = defaultSitePages.global.content;
  const navItems = getObjectArray<NavigationEntry>(
    page.content,
    "navItems",
    getObjectArray<NavigationEntry>(
      defaults,
      "navItems",
      [],
      ["href", "label"],
    ),
    ["href", "label"],
  );

  return (
    <HeaderClient
      navItems={navItems}
      newsletterLabel={getString(
        page.content,
        "newsletterLabel",
        getString(defaults, "newsletterLabel", "Newsletter"),
      )}
    />
  );
}
