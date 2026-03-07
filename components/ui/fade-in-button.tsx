import { MotiView, AnimatePresence } from "moti";

interface FadeInButtonProps {
	visible: boolean;
	children: React.ReactNode;
}

export function FadeInButton({ visible, children }: FadeInButtonProps) {
	return (
		<AnimatePresence>
			{visible && (
				<MotiView
					from={{ opacity: 0, translateY: 10 }}
					animate={{ opacity: 1, translateY: 0 }}
					exit={{ opacity: 0, translateY: 10 }}
					transition={{ type: "timing", duration: 220 }}
				>
					{children}
				</MotiView>
			)}
		</AnimatePresence>
	);
}
