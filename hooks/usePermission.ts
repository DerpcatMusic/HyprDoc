import { useAuth } from '../context/AuthContext';
import { useDocument } from '../context/DocumentContext';
import { useMemo } from 'react';

export interface PermissionResult {
    canEdit: boolean;
    canSign: boolean;
    isAssigned: boolean;
    isOwner: boolean;
}

export const usePermission = (assignedToPartyId?: string): PermissionResult => {
    const { user } = useAuth();
    const { doc } = useDocument();

    const permission = useMemo(() => {
        // Default: No access if not logged in
        if (!user) {
            return { canEdit: false, canSign: false, isAssigned: false, isOwner: false };
        }

        // Get user email from Clerk's emailAddresses array
        const userEmail = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress;
        
        if (!userEmail) {
            return { canEdit: false, canSign: false, isAssigned: false, isOwner: false };
        }

        // Identify Owner (First party)
        const ownerParty = doc.parties[0];
        const isOwner = ownerParty && userEmail === ownerParty.email;

        // If no specific assignment
        if (!assignedToPartyId) {
            // Owner has full control over unassigned blocks
            return { canEdit: isOwner || true, canSign: false, isAssigned: false, isOwner: !!isOwner };
        }

        // Find assigned party
        const assignedParty = doc.parties.find(p => p.id === assignedToPartyId);
        
        // If party not found (deleted?), fallback to owner
        if (!assignedParty) {
            return { canEdit: !!isOwner, canSign: false, isAssigned: false, isOwner: !!isOwner };
        }

        // Check if current user is the assigned party
        const isAssignedUser = userEmail === assignedParty.email;

        return {
            canEdit: isAssignedUser,
            canSign: isAssignedUser,
            isAssigned: isAssignedUser,
            isOwner: !!isOwner
        };
    }, [user, doc.parties, assignedToPartyId]);

    return permission;
};
