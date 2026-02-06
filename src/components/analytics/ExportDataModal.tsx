// src/components/analytics/ExportDataModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../shared/overlay/Modal";
import Button from "../shared/buttons/Button";
import SelectFilter from "../shared/inputs/SelectFilter";
import ToggleSwitch from "../shared/inputs/ToggleSwitch";
import TextInput from "../shared/inputs/TextInput";
import type { AnalyticsRange } from "../../pages/analytics/AnalyticsPage";
import {
  getDailyActiveUsers,
  getWeeklyActiveUsers,
  getMembershipDistribution,
  getSystemEngagement,
  getTopArticles,
} from "../../services/analyticsService";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultRange: AnalyticsRange;
};

const ExportDataModal: React.FC<Props> = ({
  open,
  onClose,
  defaultRange,
}) => {
  // If defaultRange is "custom", fallback to "last_7_days" since custom is disabled
  const safeDefaultRange = defaultRange === "custom" ? "last_7_days" : defaultRange;
  const [range, setRange] = useState<AnalyticsRange>(safeDefaultRange);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [includeUsers, setIncludeUsers] = useState(true);
  const [includeDisputes, setIncludeDisputes] = useState(true);
  const [includeContent, setIncludeContent] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync range when modal opens or props change
  useEffect(() => {
    if (open) {
      // Prevent "custom" from being set
      const safeRange = defaultRange === "custom" ? "last_7_days" : defaultRange;
      setRange(safeRange);
    }
  }, [open, defaultRange]);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // For CSV format, fetch real data and build CSV
      if (format === "csv") {
        const rows: string[] = [];

        // header
        rows.push(["dataset", "id", "label", "value"].join(","));

        // Fetch real analytics data
        if (includeUsers) {
          const [dauData, wauData, membershipData] = await Promise.all([
            getDailyActiveUsers(range),
            getWeeklyActiveUsers(range),
            getMembershipDistribution(),
          ]);

          // Daily Active Users - total and average
          const dauTotal = dauData.reduce((sum, d) => sum + d.value, 0);
          const dauAvg = dauData.length > 0 ? Math.round(dauTotal / dauData.length) : 0;
          rows.push(["users", "dau_total", "Daily Active Users (Total)", dauTotal.toString()].join(","));
          rows.push(["users", "dau_avg", "Daily Active Users (Average)", dauAvg.toString()].join(","));

          // Weekly Active Users - total and average
          const wauTotal = wauData.reduce((sum, d) => sum + d.value, 0);
          const wauAvg = wauData.length > 0 ? Math.round(wauTotal / wauData.length) : 0;
          rows.push(["users", "wau_total", "Weekly Active Users (Total)", wauTotal.toString()].join(","));
          rows.push(["users", "wau_avg", "Weekly Active Users (Average)", wauAvg.toString()].join(","));

          // Membership Distribution
          membershipData.forEach((tier, idx) => {
            rows.push(["membership", `tier_${idx + 1}`, tier.label, tier.value.toString()].join(","));
          });
        }

        // Disputes & Letters
        if (includeDisputes) {
          const engagement = await getSystemEngagement(range);
          rows.push(["engagement", "imports", "Credit Report Imports", engagement.imports.toString()].join(","));
          rows.push(["engagement", "letters", "Letters Generated", engagement.letters.toString()].join(","));
          rows.push(["engagement", "disputes", "Disputes Created", engagement.disputes.toString()].join(","));
          rows.push(["engagement", "total", "Total Actions", engagement.total.toString()].join(","));
        }

        // Content Performance
        if (includeContent) {
          const articles = await getTopArticles(range);
          articles.forEach((article, idx) => {
            rows.push(["content", `article_${idx + 1}`, article.title, article.views.toString()].join(","));
          });
        }

        // metadata row
        rows.push(["", "", "range", range].join(","));
        rows.push(["", "", "exported_at", new Date().toISOString()].join(","));

        const csv = rows.join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `analytics-export-${range}-${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // If an email was provided, you would call your backend API here
        // to send the file to the email. For now we just log the intent.
        if (email) {
          console.log(`Would send export to ${email} (not implemented).`);
        }

        setLoading(false);
        onClose();
        return;
      }

      console.log("PDF export requested (not implemented)");
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      // handle error / toast here
      console.error("Failed to export analytics", err);
      alert("Failed to export analytics data. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Export Analytics Data"
      description="Choose the date range, format, and datasets you want to export."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            type="button"
            disabled={loading}
          >
            {loading ? "Preparing..." : "Export"}
          </Button>
        </>
      }
    >
      <div className="space-y-6 text-sm">
        {/* Date range + format */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">
              Date Range
            </p>
            <SelectFilter
              value={range}
              onChange={(val) => {
                const newRange = (val as AnalyticsRange) || safeDefaultRange;
                // Prevent "custom" from being selected
                if (newRange !== "custom") {
                  setRange(newRange);
                }
              }}
              options={[
                { value: "last_7_days", label: "Last 7 Days" },
                { value: "last_30_days", label: "Last 30 Days" },
                { value: "this_month", label: "This Month" },
                { value: "this_quarter", label: "This Quarter" },
                // Custom Range temporarily disabled
                // { value: "custom", label: "Custom Range" },
              ]}
              placeholder="Select range"
              className="w-full"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">
              File Format
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={format === "csv" ? "primary" : "secondary"}
                onClick={() => setFormat("csv")}
              >
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant={format === "pdf" ? "primary" : "secondary"}
                onClick={() => setFormat("pdf")}
              >
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Datasets */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">
            Include Data
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span>Users & Membership</span>
              <ToggleSwitch
                checked={includeUsers}
                onChange={setIncludeUsers}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Disputes & Letters</span>
              <ToggleSwitch
                checked={includeDisputes}
                onChange={setIncludeDisputes}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Content Performance</span>
              <ToggleSwitch
                checked={includeContent}
                onChange={setIncludeContent}
              />
            </div>
          </div>
        </div>

        {/* Email field */}
        <div>
          <TextInput
            label="Send export link to (optional)"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="If left empty, the file will download directly in your browser."
          />
        </div>
      </div>
    </Modal>
  );
};

export default ExportDataModal;
