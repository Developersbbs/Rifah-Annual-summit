export interface IAgeGroups {
    // adults: number;
    // children: number;
    guest: number;
}

export interface ICheckIn {
    isCheckedIn: boolean;
    memberPresent: boolean;
    timestamp?: Date;
    // actualAdults?: number;
    // actualChildren?: number;
    actualGuests?: number;
    checkedInBy?: string;
    checkInTime?: string; // For serialized dates
}

export interface ISecondaryMember {
    _id?: string;
    name: string;
    mobileNumber?: string;
    email?: string;
    businessName?: string;
    businessCategory?: string;
    location?: string;
    isMember?: boolean;
    isCheckedIn: boolean;
    checkedInAt?: Date | string;
    gender?: string;
}

export interface IApprovalLog {
    approvedBy?: string;
    approvedByEmail?: string;
    role?: "admin" | "super-admin";
    status?: "approved" | "rejected";
    timestamp?: string | Date;
}

export interface IParticipant {
    _id: string;
    mobileNumber: string;
    name?: string;
    email?: string;
    businessName?: string;
    businessCategory?: string;
    location?: string;
    ticketType?: string;
    ticketPrice?: number;
    totalAmount?: number;
    guestCount?: number;
    memberCount?: number;
    isMember?: boolean;
    paymentMethod?: "cash" | "online";
    paymentStatus?: "pending" | "completed" | "failed";
    approvalStatus?: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedRole?: "admin" | "super-admin";
    ageGroups?: IAgeGroups;
    isRegistered: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    checkIn?: ICheckIn;
    secondaryMembers?: ISecondaryMember[];
    eventId?: string;
    rescheduledTo?: string;
    eventDate?: string | Date;
    isRescheduled?: boolean;
    taxRate?: number;
    taxAmount?: number;
    baseAmount?: number;
    primaryAmount?: {
        baseAmount?: number;
        taxAmount?: number;
        totalAmount?: number;
    };
    gstNumber?: string;
    gender?: string;
    rejectionReason?: string;
    approvalLogs?: IApprovalLog[];
    registrationLanguage?: "en" | "ta";
}

export interface IEvent {
    _id: string;
    eventName: string;
    startDate: string | Date;
    endDate: string | Date;
    location: string;
    maxCapacity: number;
    registeredCount: number;
    isActive: boolean;
    ticketsPrice: ITicketPrice[];
    createdBy?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface ITicketPrice {
    name: string;
    price: number;
    soldCount: number;
}

export interface IUser {
    _id: string;
    email: string;
    role: string;
    createdAt: string | Date;
}
