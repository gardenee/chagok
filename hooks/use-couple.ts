import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createCouple,
	joinCouple,
	getCoupleInfo,
	updateBookName,
} from "../services/couple";
import { useAuthStore } from "../store/auth";

export function useCreateCouple() {
	return useMutation({
		mutationFn: (bookName: string) => createCouple(bookName),
	});
}

export function useJoinCouple() {
	return useMutation({
		mutationFn: (inviteCode: string) => joinCouple(inviteCode),
	});
}

export function useCouple() {
	const { userProfile } = useAuthStore();
	const coupleId = userProfile?.couple_id;

	return useQuery({
		queryKey: ["couple", coupleId],
		queryFn: () => getCoupleInfo(coupleId!),
		enabled: !!coupleId,
	});
}

export function useUpdateBookName() {
	const queryClient = useQueryClient();
	const { userProfile } = useAuthStore();
	const coupleId = userProfile?.couple_id;

	return useMutation({
		mutationFn: (bookName: string) => updateBookName(coupleId!, bookName),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["couple", coupleId] });
		},
	});
}
