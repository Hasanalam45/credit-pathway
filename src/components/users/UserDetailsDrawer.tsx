// src/components/users/UserDetailsDrawer.tsx
import React, { useState } from "react";
import Drawer from "../shared/overlay/Drawer";
import Avatar from "../shared/data-display/Avatar";
import Tabs, { type Tab } from "../shared/navigation/Tabs";
import Button from "../shared/buttons/Button";
import type { User } from "./UserTable";
import { useUserDetails } from "../../hooks/useUserDetails";

type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
};

const DETAIL_TABS: Tab[] = [
  { label: "User Details", value: "details" },
  { label: "Documents", value: "documents" },
  { label: "Credit Monitoring", value: "monitoring" },
];

const UserDetailsDrawer: React.FC<Props> = ({
  open,
  user,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const [tab, setTab] = useState<string>("details");
  
  // Fetch full user details with credit data
  const { user: userDetails, loading: detailsLoading } = useUserDetails(user?.id || null);

  if (!user) return null;

  const handleEdit = () => onEdit(user);
  const handleToggle = () => onToggleStatus(user);

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title="User Details"
      widthClassName="w-full max-w-md"
    >
      {/* Header with avatar & name */}
      <div className="flex items-center gap-3 pb-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={DETAIL_TABS}
          value={tab}
          onChange={setTab}
          variant="underline"
        />
      </div>

      {/* Tab content */}
      {tab === "details" && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-800 dark:text-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Tier
            </p>
            <p className="dark:text-gray-100">{user.tier}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Status
            </p>
            <p className="capitalize dark:text-gray-100">{user.status}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Phone Number
            </p>
            <p className="dark:text-gray-100">{user.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Address
            </p>
            <p className="dark:text-gray-100">{user.address ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Date Joined
            </p>
            <p className="dark:text-gray-100">{user.dateJoined}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Last Activity
            </p>
            <p className="dark:text-gray-100">{user.lastActivity}</p>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-4">
          {detailsLoading ? (
            <div className="text-sm text-gray-500">Loading documents...</div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Driving License
                  </p>
                  {userDetails?.drivingLicenseUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={userDetails.drivingLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Document
                      </a>
                      <span className="text-xs text-gray-400">(Opens in new tab)</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Credit Report
                  </p>
                  {userDetails?.creditReportUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={userDetails.creditReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Document
                      </a>
                      <span className="text-xs text-gray-400">(Opens in new tab)</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Documents Status
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {userDetails?.documentsCompleted ? (
                      <span className="text-green-600 dark:text-green-400">Completed</span>
                    ) : (
                      <span className="text-gray-500">Incomplete</span>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "monitoring" && (
        <div className="space-y-6">
          {detailsLoading ? (
            <div className="text-sm text-gray-500">Loading credit data...</div>
          ) : (
            <>
              {/* Credit Scores */}
              {userDetails?.scores && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    Credit Scores
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {userDetails.scores.equifax && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Equifax</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {userDetails.scores.equifax.currentScore ?? "—"}
                        </p>
                        {userDetails.scores.equifax.startingScore && (
                          <p className="text-xs text-gray-500">
                            Starting: {userDetails.scores.equifax.startingScore}
                          </p>
                        )}
                      </div>
                    )}
                    {userDetails.scores.experian && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Experian</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {userDetails.scores.experian.currentScore ?? "—"}
                        </p>
                        {userDetails.scores.experian.startingScore && (
                          <p className="text-xs text-gray-500">
                            Starting: {userDetails.scores.experian.startingScore}
                          </p>
                        )}
                      </div>
                    )}
                    {userDetails.scores.transunion && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">TransUnion</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {userDetails.scores.transunion.currentScore ?? "—"}
                        </p>
                        {userDetails.scores.transunion.startingScore && (
                          <p className="text-xs text-gray-500">
                            Starting: {userDetails.scores.transunion.startingScore}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dispute Candidates */}
              {userDetails?.creditReportAnalysis?.disputeCandidates && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    Dispute Candidates ({userDetails.creditReportAnalysis.disputeCandidates.length})
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userDetails.creditReportAnalysis.disputeCandidates.length > 0 ? (
                      userDetails.creditReportAnalysis.disputeCandidates.map((dispute: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {dispute.creditorName || "Unknown Creditor"}
                          </p>
                          {dispute.amount && (
                            <p className="text-gray-600 dark:text-gray-400">
                              Amount: ${dispute.amount}
                            </p>
                          )}
                          {dispute.category && (
                            <p className="text-gray-600 dark:text-gray-400">
                              Category: {dispute.category}
                            </p>
                          )}
                          {dispute.reason && (
                            <p className="text-xs text-gray-500 mt-1">{dispute.reason}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No dispute candidates</p>
                    )}
                  </div>
                </div>
              )}

              {/* Account Summary */}
              {userDetails?.creditReportAnalysis?.accountSummary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    Account Summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Accounts</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {userDetails.creditReportAnalysis.accountSummary.totalAccounts ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Open Accounts</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {userDetails.creditReportAnalysis.accountSummary.openAccounts ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Delinquent</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {userDetails.creditReportAnalysis.accountSummary.delinquent ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Derogatory</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {userDetails.creditReportAnalysis.accountSummary.derogatory ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!userDetails?.scores && 
               !userDetails?.creditReportAnalysis?.disputeCandidates && 
               !userDetails?.creditReportAnalysis?.accountSummary && (
                <div className="text-sm text-gray-500">
                  No credit monitoring data available yet.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer buttons */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={handleToggle}
        >
          {user.status === "active" ? "Deactivate" : "Reactivate"}
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={handleEdit}
        >
          Edit Details
        </Button>
      </div>
    </Drawer>
  );
};

export default UserDetailsDrawer;
