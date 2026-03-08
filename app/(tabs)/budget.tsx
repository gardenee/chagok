import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	Modal,
	TextInput,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useState, useMemo } from "react";
import {
	Plus,
	X,
	Check,
	Trash2,
	ChevronLeft,
	ChevronRight,
	ShoppingCart,
	Utensils,
	Car,
	Home,
	Heart,
	BookOpen,
	Coffee,
	Plane,
	Shirt,
	Zap,
	Gift,
	Wallet,
	Dumbbell,
	Music,
	Baby,
	Scissors,
	PawPrint,
	Smartphone,
	type LucideIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../../constants/colors";
import {
	useCategories,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
} from "../../hooks/use-categories";
import { useMonthTransactions } from "../../hooks/use-transactions";
import type { Category } from "../../types/database";

const ICON_MAP: Record<string, LucideIcon> = {
	shopping: ShoppingCart,
	food: Utensils,
	transport: Car,
	home: Home,
	health: Heart,
	education: BookOpen,
	cafe: Coffee,
	travel: Plane,
	fashion: Shirt,
	telecom: Zap,
	gift: Gift,
	wallet: Wallet,
	fitness: Dumbbell,
	music: Music,
	baby: Baby,
	beauty: Scissors,
	pet: PawPrint,
	digital: Smartphone,
};

const COLOR_OPTIONS = [
	"#F7B8A0",
	"#D4C5F0",
	"#FAD97A",
	"#A8D8B0",
	"#F0C5D5",
	"#B5D5F0",
	"#F5D0A0",
	"#C5E8D5",
	"#E0B5D5",
	"#B5C8E8",
	"#E8D8B0",
	"#D0E8B5",
];

function formatAmount(n: number): string {
	return n.toLocaleString("ko-KR");
}

type FormData = {
	name: string;
	icon: string;
	color: string;
	budget_amount: string;
};

const INITIAL_FORM: FormData = {
	name: "",
	icon: "shopping",
	color: COLOR_OPTIONS[0],
	budget_amount: "",
};

function CategoryIcon({
	iconKey,
	color,
	size = 18,
}: {
	iconKey: string;
	color: string;
	size?: number;
}) {
	const Icon = ICON_MAP[iconKey] ?? Wallet;
	return <Icon size={size} color={color} strokeWidth={2.5} />;
}

export default function BudgetTab() {
	const today = new Date();
	const [year, setYear] = useState(today.getFullYear());
	const [month, setMonth] = useState(today.getMonth());

	const { data: categories = [], isLoading } = useCategories();
	const { data: transactions = [] } = useMonthTransactions(year, month);

	const createCategory = useCreateCategory();
	const updateCategory = useUpdateCategory();
	const deleteCategory = useDeleteCategory();

	const [modal, setModal] = useState<{
		visible: boolean;
		editingId: string | null;
		form: FormData;
	}>({
		visible: false,
		editingId: null,
		form: INITIAL_FORM,
	});

	// 카테고리별 이번달 지출 합산
	const spendingByCategory = useMemo(() => {
		const map: Record<string, number> = {};
		for (const t of transactions) {
			if (t.type === "expense" && t.category_id) {
				map[t.category_id] = (map[t.category_id] ?? 0) + t.amount;
			}
		}
		return map;
	}, [transactions]);

	const totalBudget = categories.reduce((s, c) => s + c.budget_amount, 0);
	const totalSpent = categories.reduce(
		(s, c) => s + (spendingByCategory[c.id] ?? 0),
		0,
	);
	const totalRemaining = totalBudget - totalSpent;
	const totalRatio =
		totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
	const isOver = totalSpent > totalBudget && totalBudget > 0;

	const isSaving = createCategory.isPending || updateCategory.isPending;

	function prevMonth() {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		if (month === 0) {
			setYear((y) => y - 1);
			setMonth(11);
		} else setMonth((m) => m - 1);
	}
	function nextMonth() {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		if (month === 11) {
			setYear((y) => y + 1);
			setMonth(0);
		} else setMonth((m) => m + 1);
	}

	function openCreate() {
		setModal({ visible: true, editingId: null, form: INITIAL_FORM });
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}
	function openEdit(c: Category) {
		setModal({
			visible: true,
			editingId: c.id,
			form: {
				name: c.name,
				icon: c.icon,
				color: c.color,
				budget_amount: String(c.budget_amount),
			},
		});
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	async function handleSave() {
		const name = modal.form.name.trim();
		const amount = parseInt(
			modal.form.budget_amount.replace(/[^0-9]/g, ""),
			10,
		);
		if (!name) {
			Alert.alert("입력 오류", "카테고리 이름을 입력해주세요");
			return;
		}
		if (!amount || amount <= 0) {
			Alert.alert("입력 오류", "예산을 올바르게 입력해주세요");
			return;
		}
		try {
			if (modal.editingId) {
				await updateCategory.mutateAsync({
					id: modal.editingId,
					name,
					icon: modal.form.icon,
					color: modal.form.color,
					budget_amount: amount,
				});
			} else {
				await createCategory.mutateAsync({
					name,
					icon: modal.form.icon,
					color: modal.form.color,
					budget_amount: amount,
					sort_order: categories.length,
				});
			}
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			setModal((s) => ({ ...s, visible: false }));
		} catch {
			Alert.alert("오류", "저장 중 문제가 발생했어요");
		}
	}

	function handleDelete(id: string) {
		Alert.alert("카테고리 삭제", "삭제하면 관련 예산도 사라져요. 삭제할까요?", [
			{ text: "취소", style: "cancel" },
			{
				text: "삭제",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteCategory.mutateAsync(id);
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
						setModal((s) => ({ ...s, visible: false }));
					} catch {
						Alert.alert("오류", "삭제 중 문제가 발생했어요");
					}
				},
			},
		]);
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				{/* 헤더 */}
				<View className="flex-row items-center justify-between px-6 pt-6 pb-2">
					<Text className="font-ibm-bold text-2xl text-brown-darker">
						예산·결산
					</Text>
					<TouchableOpacity
						onPress={openCreate}
						className="w-10 h-10 rounded-full items-center justify-center"
						activeOpacity={0.6}
					>
						<Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
					</TouchableOpacity>
				</View>

				{/* 월 네비게이터 */}
				<View className="flex-row items-center justify-center gap-5 px-6 pt-1 pb-3">
					<TouchableOpacity
						onPress={prevMonth}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<ChevronLeft size={20} color="#404040" strokeWidth={2.5} />
					</TouchableOpacity>
					<Text className="font-ibm-semibold text-base text-neutral-700 w-24 text-center">
						{year}년 {month + 1}월
					</Text>
					<TouchableOpacity
						onPress={nextMonth}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<ChevronRight size={20} color="#404040" strokeWidth={2.5} />
					</TouchableOpacity>
				</View>

				{/* 총 예산 vs 지출 요약 카드 */}
				{totalBudget > 0 && (
					<View
						className="mx-4 rounded-3xl px-6 py-5"
						style={{
							backgroundColor: isOver ? Colors.peach : Colors.butter,
							shadowColor: "#000",
							shadowOpacity: 0.06,
							shadowRadius: 10,
							shadowOffset: { width: 0, height: 3 },
						}}
					>
						<View className="flex-row justify-between items-start mb-3">
							<View>
								<Text className="font-ibm-regular text-xs text-brown/80 mb-0.5">
									이번 달 지출
								</Text>
								<Text className="font-ibm-bold text-2xl text-brown">
									{formatAmount(totalSpent)}원
								</Text>
							</View>
							<View className="items-end">
								<Text className="font-ibm-regular text-xs text-brown/80 mb-0.5">
									총 예산
								</Text>
								<Text className="font-ibm-semibold text-base text-brown">
									{formatAmount(totalBudget)}원
								</Text>
							</View>
						</View>

						{/* 전체 프로그레스 바 */}
						<View className="bg-brown/15 rounded-full h-2 mb-2">
							<View
								className="h-2 rounded-full bg-brown/60"
								style={{ width: `${totalRatio * 100}%` }}
							/>
						</View>

						<Text className="font-ibm-semibold text-xs text-brown/80">
							{isOver
								? `예산 ${formatAmount(totalSpent - totalBudget)}원 초과`
								: `${formatAmount(totalRemaining)}원 남음`}
						</Text>
					</View>
				)}

				{/* 카테고리별 결산 */}
				<View className="mx-4 mt-5">
					<Text className="font-ibm-bold text-base text-neutral-700 mb-3">
						카테고리별 현황
					</Text>

					{isLoading ? (
						<View className="py-12 items-center">
							<ActivityIndicator color={Colors.butter} />
						</View>
					) : categories.length === 0 ? (
						<View className="bg-cream-dark/40 rounded-3xl py-12 items-center gap-3">
							<Wallet size={32} color={Colors.brown + "30"} strokeWidth={1.5} />
							<Text className="font-ibm-semibold text-sm text-neutral-400">
								카테고리가 없어요
							</Text>
							<Text className="font-ibm-regular text-xs text-neutral-400">
								+ 버튼으로 추가해보세요
							</Text>
						</View>
					) : (
						<View className="gap-2.5">
							{categories.map((c) => {
								const spent = spendingByCategory[c.id] ?? 0;
								const ratio =
									c.budget_amount > 0
										? Math.min(spent / c.budget_amount, 1)
										: 0;
								const over = spent > c.budget_amount && c.budget_amount > 0;
								const remaining = c.budget_amount - spent;
								return (
									<TouchableOpacity
										key={c.id}
										onPress={() => openEdit(c)}
										activeOpacity={0.8}
									>
										<View
											className="bg-white rounded-3xl px-4 py-4"
											style={{
												shadowColor: Colors.brown,
												shadowOpacity: 0.07,
												shadowRadius: 10,
												shadowOffset: { width: 0, height: 2 },
											}}
										>
											<View className="flex-row items-center gap-3 mb-3">
												<View
													className="w-10 h-10 rounded-2xl items-center justify-center"
													style={{ backgroundColor: c.color + "55" }}
												>
													<CategoryIcon iconKey={c.icon} color={c.color} />
												</View>
												<View className="flex-1">
													<Text className="font-ibm-semibold text-sm text-neutral-800">
														{c.name}
													</Text>
													<Text className="font-ibm-regular text-xs text-neutral-500">
														예산 {formatAmount(c.budget_amount)}원
													</Text>
												</View>
												<View className="items-end">
													<Text
														className={`font-ibm-bold text-sm ${over ? "text-peach" : "text-neutral-800"}`}
													>
														{formatAmount(spent)}원
													</Text>
													<Text className="font-ibm-regular text-[10px] text-neutral-400">
														{over
															? `${formatAmount(spent - c.budget_amount)}원 초과`
															: `${formatAmount(remaining)}원 남음`}
													</Text>
												</View>
											</View>

											{/* 카테고리 프로그레스 바 */}
											<View className="bg-cream-dark rounded-full h-1.5">
												<View
													className="h-1.5 rounded-full"
													style={{
														width: `${ratio * 100}%`,
														backgroundColor: over ? Colors.peach : c.color,
													}}
												/>
											</View>
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				</View>
			</ScrollView>

			{/* ── 카테고리 추가/수정 모달 ── */}
			<Modal
				visible={modal.visible}
				animationType="slide"
				transparent
				onRequestClose={() => setModal((s) => ({ ...s, visible: false }))}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					className="flex-1 justify-end"
				>
					<TouchableOpacity
						className="flex-1"
						activeOpacity={1}
						onPress={() => setModal((s) => ({ ...s, visible: false }))}
					/>
					<View
						className="bg-white rounded-t-3xl px-6 pt-5 pb-10"
						style={{
							shadowColor: "#000",
							shadowOpacity: 0.1,
							shadowRadius: 20,
							shadowOffset: { width: 0, height: -4 },
						}}
					>
						<View className="flex-row items-center justify-between mb-5">
							<Text className="font-ibm-bold text-lg text-neutral-800">
								{modal.editingId ? "카테고리 수정" : "카테고리 추가"}
							</Text>
							<View className="flex-row items-center gap-3">
								{modal.editingId && (
									<TouchableOpacity
										onPress={() => handleDelete(modal.editingId!)}
										hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
									>
										<Trash2
											size={18}
											color={Colors.brown + "60"}
											strokeWidth={2}
										/>
									</TouchableOpacity>
								)}
								<TouchableOpacity
									onPress={() => setModal((s) => ({ ...s, visible: false }))}
								>
									<X size={22} color={Colors.brown} strokeWidth={2} />
								</TouchableOpacity>
							</View>
						</View>

						<View className="bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4">
							<TextInput
								className="font-ibm-regular text-sm text-neutral-800"
								placeholder="카테고리 이름 (예: 식비, 교통비)"
								placeholderTextColor="#A3A3A3"
								value={modal.form.name}
								onChangeText={(v) =>
									setModal((s) => ({ ...s, form: { ...s.form, name: v } }))
								}
								maxLength={10}
							/>
						</View>

						<Text className="font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1">
							아이콘
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							className="mb-4"
						>
							<View className="flex-row gap-2 pr-2">
								{Object.entries(ICON_MAP).map(([key, Icon]) => {
									const isSelected = modal.form.icon === key;
									return (
										<TouchableOpacity
											key={key}
											onPress={() =>
												setModal((s) => ({
													...s,
													form: { ...s.form, icon: key },
												}))
											}
											className={`w-12 h-12 rounded-2xl items-center justify-center ${isSelected ? "bg-butter" : "bg-neutral-100"}`}
											activeOpacity={0.7}
										>
											<Icon
												size={20}
												color={isSelected ? Colors.brown : "#A3A3A3"}
												strokeWidth={2.5}
											/>
										</TouchableOpacity>
									);
								})}
							</View>
						</ScrollView>

						<Text className="font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1">
							색상
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-4">
							{COLOR_OPTIONS.map((color) => {
								const isSelected = modal.form.color === color;
								return (
									<TouchableOpacity
										key={color}
										onPress={() =>
											setModal((s) => ({ ...s, form: { ...s.form, color } }))
										}
										className="w-9 h-9 rounded-full items-center justify-center"
										style={{
											backgroundColor: color,
											borderWidth: isSelected ? 2.5 : 0,
											borderColor: Colors.brown,
										}}
										activeOpacity={0.7}
									>
										{isSelected && (
											<Check size={14} color={Colors.brown} strokeWidth={3} />
										)}
									</TouchableOpacity>
								);
							})}
						</View>

						<View className="bg-neutral-100 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
							<Text className="font-ibm-semibold text-neutral-500 text-base mr-2">
								₩
							</Text>
							<TextInput
								className="flex-1 font-ibm-semibold text-base text-neutral-800"
								placeholder="월 예산 금액"
								placeholderTextColor="#A3A3A3"
								keyboardType="numeric"
								value={modal.form.budget_amount}
								onChangeText={(v) =>
									setModal((s) => ({
										...s,
										form: {
											...s.form,
											budget_amount: v.replace(/[^0-9]/g, ""),
										},
									}))
								}
							/>
							<Text className="font-ibm-regular text-sm text-neutral-400">
								원
							</Text>
						</View>

						<TouchableOpacity
							onPress={handleSave}
							disabled={isSaving}
							className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2"
							activeOpacity={0.8}
							style={{
								shadowColor: Colors.butter,
								shadowOpacity: 0.25,
								shadowRadius: 6,
								shadowOffset: { width: 0, height: 3 },
							}}
						>
							{isSaving ? (
								<ActivityIndicator color={Colors.brown} />
							) : (
								<>
									<Check size={18} color={Colors.brown} strokeWidth={2.5} />
									<Text className="font-ibm-bold text-base text-brown">
										{modal.editingId ? "수정 완료" : "저장"}
									</Text>
								</>
							)}
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}
