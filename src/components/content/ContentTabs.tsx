import React from "react";
import Tabs, { type Tab } from "../shared/navigation/Tabs";

export type ContentTab =
  | "articles"
  | "lessons"
  | "videos"
  | "links"
  | "static";

type Props = {
  value: ContentTab;
  onChange: (value: ContentTab) => void;
};

const CONTENT_TABS: Tab[] = [
  { label: "Articles", value: "articles" },
  { label: "Lessons", value: "lessons" },
  { label: "Videos", value: "videos" },
  { label: "Credit Resource Links", value: "links" },
  { label: "Static Pages", value: "static" },
];

const ContentTabs: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <Tabs
        tabs={CONTENT_TABS}
        value={value}
        onChange={(val) => onChange(val as ContentTab)}
        variant="underline"
      />
    </div>
  );
};

export default ContentTabs;
