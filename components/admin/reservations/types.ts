export interface ReservationItem {
  id: string;
  displayId: string | null;
  startTime: string;
  endTime: string;
  justification: string;
  subject: string | null;
  coordinator: string | null;
  teacher: string | null;
  status: string;
  user: { id: string; name: string | null; email: string };
  space?: { id: string; name: string; responsibleUsers?: { id: string }[] };
  equipment?: { id: string; name: string; responsibleUsers?: { id: string }[]; space?: { id: string; name: string } | null };
  workshop?: { id: string; name: string };
  documents?: { id: string; fileName: string; filePath: string }[];
}

export interface GroupedReservation {
  cartSubmissionId: string;
  items: ReservationItem[];
  overallStatus: string; // PENDING, APPROVED, REJECTED, PARTIALLY_APPROVED
}