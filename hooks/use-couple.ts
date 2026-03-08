import { useMutation } from "@tanstack/react-query";
import { createCouple, joinCouple } from "../services/couple";

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
