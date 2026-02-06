// src/pages/users/UserManagementPage.tsx
import React, { useEffect, useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import Button from "../../components/shared/buttons/Button";
import UserTable, {
  type User,
  type UserStatus,
  type UserTier,
  type SortBy,
} from "../../components/users/UserTable";
import UserDetailsDrawer from "../../components/users/UserDetailsDrawer";
import UserFormModal, {
  type UserFormValues,
} from "../../components/users/UserFormModal";
import { useUsers } from "../../hooks/useUsers";

const PAGE_SIZE = 5;

const UserManagementPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<UserTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortBy>("date_joined");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Use the custom hook for fetching users
  const { users, total, loading, error, createUser, updateUser } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    tierFilter: tierFilter !== "all" ? tierFilter : undefined,
    statusFilter: statusFilter !== "all" ? statusFilter : undefined,
    sortBy,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, statusFilter, sortBy]);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleOpenCreateUser = () => {
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: UserFormValues) => {
    try {
      if (formMode === "create") {
        if (!values.password) {
          alert("Password is required for new users.");
          return;
        }
        
        await createUser({
          name: values.name,
          email: values.email,
          password: values.password,
          tier: values.tier,
          status: values.status,
          phone: values.phone,
          address: values.address,
          dateJoined: values.dateJoined,
        });
        
        // Close the form
        setFormOpen(false);
        setEditingUser(null);
      } else if (formMode === "edit" && editingUser) {
        await updateUser(editingUser.id, {
          name: values.name,
          email: values.email,
          tier: values.tier,
          status: values.status,
          phone: values.phone,
          address: values.address,
          dateJoined: values.dateJoined,
          lastActivity: values.lastActivity,
        });
        
        // Update selected user if it's the same one
        if (selectedUser?.id === editingUser.id) {
          setSelectedUser({
            ...selectedUser,
            ...values,
          });
        }
        
        // Close the form
        setFormOpen(false);
        setEditingUser(null);
      }
    } catch (err: any) {
      console.error("Error saving user:", err);
      alert(err.message || "Failed to save user. Please try again.");
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const nextStatus: UserStatus =
        user.status === "active" ? "inactive" : "active";
      
      await updateUser(user.id, { status: nextStatus });
      
      // Update selected user if it's the same one
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, status: nextStatus });
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.message || "Failed to update status. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage all user accounts in the system."
        rightContent={
          <>
            <Button variant="primary" onClick={handleOpenCreateUser}>
              + Add User
            </Button>
            {/* Top-right admin avatar can be part of your layout header */}
          </>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading users...
          </div>
        </div>
      ) : (
        <UserTable
          users={users}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          search={search}
          onSearchChange={setSearch}
          tierFilter={tierFilter}
          onTierFilterChange={setTierFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onRowClick={handleRowClick}
        />
      )}

      <UserDetailsDrawer
        open={detailsOpen}
        user={selectedUser}
        onClose={() => setDetailsOpen(false)}
        onEdit={handleEditUser}
        onToggleStatus={handleToggleStatus}
      />

      <UserFormModal
        open={formOpen}
        mode={formMode}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        initialValues={editingUser || undefined}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default UserManagementPage;
