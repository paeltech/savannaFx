"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, UserCheck, UserX } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
  updated_at: string;
}

interface UserWithRole extends UserRole {
  email?: string;
  created_at_user?: string;
}

const AdminUsers: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: userRoles, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["admin-user-roles", roleFilter],
    queryFn: async () => {
      // First get all user roles
      let query = supabase.from("user_roles").select("*").order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data: roles, error: rolesError } = await query;

      if (rolesError) throw rolesError;

      // For each role, try to get user email from auth.users (this might require admin access)
      // For now, we'll just return the roles
      return (roles || []) as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "moderator" | "user";
    }) => {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      showSuccess("User role updated successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update user role");
    },
  });

  const filteredUsers = userRoles?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return user.user_id.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      admin: { label: "Admin", className: "bg-red-600 text-white" },
      moderator: { label: "Moderator", className: "bg-blue-600 text-white" },
      user: { label: "User", className: "bg-gray-600 text-white" },
    };
    const variant = variants[role] || variants.user;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <SavannaCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-gold" size={24} />
              <div>
                <h1 className="text-2xl font-semibold text-white">User Management</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  Manage user roles and permissions
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by user ID or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-nero border-steel-wool text-white">
                  <Shield className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </SavannaCard>

        <SavannaCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading...</div>
            ) : filteredUsers?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">User ID</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Current Role</TableHead>
                      <TableHead className="text-white">Created</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow key={user.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-rainy-grey font-mono text-xs">
                          {user.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-rainy-grey">
                          {user.email || "N/A"}
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              updateRoleMutation.mutate({
                                userId: user.user_id,
                                role: value as "admin" | "moderator" | "user",
                              })
                            }
                          >
                            <SelectTrigger className="w-[140px] bg-nero border-steel-wool text-white text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </SavannaCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminUsers;
