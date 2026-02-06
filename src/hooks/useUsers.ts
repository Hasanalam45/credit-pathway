/**
 * Custom hook for fetching and managing users
 */

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser } from "../services/userService";
import type { GetUsersParams, GetUsersResult, CreateUserData, UpdateUserData } from "../services/userService";
import type { User } from "../components/users/UserTable";

interface UseUsersReturn {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  refresh: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<string>;
  updateUser: (userId: string, updates: UpdateUserData) => Promise<void>;
}

/**
 * Hook to fetch and manage users with pagination, filtering, and sorting
 */
export const useUsers = (params: GetUsersParams): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result: GetUsersResult = await getUsers(params);
      setUsers(result.users);
      setTotal(result.total);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search, params.tierFilter, params.statusFilter, params.sortBy]);

  const handleCreateUser = async (userData: CreateUserData): Promise<string> => {
    try {
      setCreating(true);
      setError(null);
      const userId = await createUser(userData);
      // Refresh the list after creation
      await fetchUsers();
      return userId;
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user");
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: UpdateUserData): Promise<void> => {
    try {
      setUpdating(true);
      setError(null);
      await updateUser(userId, updates);
      // Refresh the list after update
      await fetchUsers();
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || "Failed to update user");
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    users,
    total,
    loading,
    error,
    creating,
    updating,
    refresh: fetchUsers,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
  };
};

