import { supabase } from "../lib/supabase";
import type { Couple } from "../types/database";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ1234567890";

function generateInviteCode(): string {
	let code = "";
	for (let i = 0; i < 6; i++) {
		code +=
			INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
	}
	return code;
}

// 초대코드 중복 시 최대 5회 재시도
export async function createCouple(bookName: string): Promise<string> {
	const MAX_RETRIES = 5;
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const code = generateInviteCode();
		const { error } = await supabase.rpc("create_couple", {
			book_name: bookName,
			invite_code: code,
		});

		if (!error) return code;

		// 초대코드 UNIQUE 충돌이면 재시도, 그 외 에러는 즉시 throw
		if (error.code === "23505") continue;
		throw error;
	}
	throw new Error("초대코드 생성에 실패했습니다. 다시 시도해 주세요.");
}

export type JoinCoupleError =
	| "INVALID_CODE"
	| "ALREADY_IN_COUPLE"
	| "OWN_COUPLE"
	| "COUPLE_FULL";

export async function joinCouple(inviteCode: string): Promise<void> {
	const { error } = await supabase.rpc("join_couple", {
		invite_code: inviteCode,
	});
	if (!error) return;

	if (error.code === "P0001") {
		const msg = error.message;
		if (msg.includes("유효하지 않은")) throw new Error("INVALID_CODE");
		if (msg.includes("이미 연동된")) throw new Error("ALREADY_IN_COUPLE");
		if (msg.includes("본인이 만든")) throw new Error("OWN_COUPLE");
		if (msg.includes("이미 두 명")) throw new Error("COUPLE_FULL");
	}
	throw error;
}

export async function getCoupleInfo(coupleId: string): Promise<Couple> {
	const { data, error } = await supabase
		.from("couples")
		.select("*")
		.eq("id", coupleId)
		.single();
	if (error) throw error;
	return data;
}

export async function updateBookName(
	coupleId: string,
	bookName: string
): Promise<void> {
	const { error } = await supabase
		.from("couples")
		.update({ book_name: bookName })
		.eq("id", coupleId);
	if (error) throw error;
}
