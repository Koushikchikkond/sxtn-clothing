"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter, Github, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface iCategoryItem {
	name: string;
	slug: string;
}

export interface iNavItem {
	heading: string;
	href: string;
	subheading?: string;
}

interface iNavLinkProps extends iNavItem {
	setIsActive: (isActive: boolean) => void;
	index: number;
}

export interface iCurvedNavbarProps {
	isActive: boolean;
	setIsActive: (isActive: boolean) => void;
	collections?: iCategoryItem[];
	footer?: React.ReactNode;
}

const MENU_SLIDE_ANIMATION = {
	initial: { x: "calc(-100% - 100px)" },
	enter: {
		x: "0",
		transition: {
			duration: 0.8,
			ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
		},
	},
	exit: {
		x: "calc(-100% - 100px)",
		transition: {
			duration: 0.8,
			ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
		},
	},
};

// ── Black-Themed Animated Menu Trigger Button ───────────────────
export function CurvedMenuTrigger({
	isActive,
	onClick,
	className,
}: {
	isActive: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={isActive ? "Close menu" : "Open menu"}
			className={cn(
				"h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-none bg-black/80 hover:bg-black border border-white/20 hover:border-white/50 text-white cursor-pointer transition-all duration-200 select-none active:scale-95 pointer-events-auto",
				className
			)}
		>
			<div className="relative w-4 h-3 md:w-5 md:h-3.5 flex flex-col justify-between items-center pointer-events-none">
				<span
					className={cn(
						"block h-[1.5px] w-4 md:w-5 bg-white transition-transform duration-300 origin-center",
						isActive && "rotate-45 translate-y-[5.5px] md:translate-y-[6px]"
					)}
				/>
				<span
					className={cn(
						"block h-[1.5px] w-4 md:w-5 bg-white transition-opacity duration-300",
						isActive && "opacity-0"
					)}
				/>
				<span
					className={cn(
						"block h-[1.5px] w-4 md:w-5 bg-white transition-transform duration-300 origin-center",
						isActive && "-rotate-45 -translate-y-[5.5px] md:-translate-y-[6px]"
					)}
				/>
			</div>
		</button>
	);
}

// ── Default Social Footer (Black Themed) ────────────────────────
const CustomFooter: React.FC<{
	loggedIn: boolean;
	onSignOut: () => void;
	onClose: () => void;
}> = ({ loggedIn, onSignOut, onClose }) => {
	return (
		<div className="flex flex-col border-t border-white/10 bg-[#0a0a0a]">
			{/* Auth row */}
			<div className="px-8 md:px-14 pt-4 pb-3 flex items-center gap-4 text-xs uppercase tracking-widest">
				{loggedIn ? (
					<button
						type="button"
						onClick={onSignOut}
						className="text-white/50 hover:text-red-400 transition-colors cursor-pointer"
					>
						Sign Out
					</button>
				) : (
					<>
						<Link
							href="/login"
							onClick={onClose}
							className="px-4 py-2 bg-white text-black font-bold tracking-widest hover:bg-white/90 transition-colors"
						>
							Sign In
						</Link>
						<Link
							href="/signup"
							onClick={onClose}
							className="text-white/50 hover:text-white transition-colors"
						>
							Create Account
						</Link>
					</>
				)}
			</div>

			{/* Social row */}
			<div className="flex w-full text-sm justify-between items-center text-white/60 px-8 md:px-14 py-4">
				<div className="flex items-center gap-5">
					<a
						href="https://instagram.com/6xtn.in"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-white transition-colors"
						aria-label="Instagram"
					>
						<Instagram size={18} />
					</a>
					<a
						href="https://twitter.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-white transition-colors"
						aria-label="Twitter / X"
					>
						<Twitter size={18} />
					</a>
					<a
						href="https://github.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-white transition-colors"
						aria-label="GitHub"
					>
						<Github size={18} />
					</a>
				</div>
				<Link
					href="/"
					onClick={onClose}
					className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 hover:text-white transition-colors"
				>
					<Globe size={15} />
					<span>6XTN.IN</span>
				</Link>
			</div>
		</div>
	);
};

// ── Letter-by-letter Animated Link (Black Themed) ───────────────
const NavLink: React.FC<iNavLinkProps> = ({
	heading,
	href,
	setIsActive,
	index,
}) => {
	const ref = useRef<HTMLAnchorElement | null>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const handleMouseMove = (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
	) => {
		if (ref.current) {
			const rect = ref.current.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			x.set(mouseX / rect.width - 0.5);
			y.set(mouseY / rect.height - 0.5);
		}
	};

	const handleClick = () => {
		setIsActive(false);
	};

	const indexFormatted = index < 10 ? `0${index}` : `${index}`;

	return (
		<motion.div
			onClick={handleClick}
			initial="initial"
			whileHover="whileHover"
			className="group relative flex items-center justify-between border-b border-white/15 py-2.5 md:py-3.5 transition-colors duration-500 uppercase"
		>
			<Link ref={ref} onMouseMove={handleMouseMove} href={href} className="w-full">
				<div className="relative flex items-center">
					<span className="text-white/40 group-hover:text-white transition-colors duration-500 text-2xl md:text-3xl font-thin mr-3">
						{indexFormatted}.
					</span>
					<div className="flex flex-row gap-2">
						<motion.span
							variants={{
								initial: { x: 0 },
								whileHover: { x: -16 },
							}}
							transition={{
								type: "spring",
								staggerChildren: 0.075,
								delayChildren: 0.25,
							}}
							className="relative z-10 block text-2xl md:text-3xl font-extralight text-white transition-colors duration-500 tracking-wider"
						>
							{heading.split("").map((letter, i) => {
								return (
									<motion.span
										key={i}
										variants={{
											initial: { x: 0 },
											whileHover: { x: 16 },
										}}
										transition={{ type: "spring" }}
										className="inline-block"
									>
										{letter === " " ? "\u00A0" : letter}
									</motion.span>
								);
							})}
						</motion.span>
					</div>
				</div>
			</Link>
		</motion.div>
	);
};

// ── Mirrored Black-Themed SVG Curve Edge ────────────────────────
const Curve: React.FC = () => {
	const [height, setHeight] = useState<number>(
		typeof window !== "undefined" ? window.innerHeight : 800
	);

	useEffect(() => {
		setHeight(window.innerHeight);
		const handleResize = () => setHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Mirrored curve for left-side panel:
	// SVG attached at right border (-right-[99px], w-[100px]).
	// Initial path bulges outward into the viewport (Q200),
	// Target path relaxes into straight edge at x=0 (Q0).
	const initialPath = `M0 0 L-100 0 L-100 ${height} L0 ${height} Q200 ${height / 2} 0 0`;
	const targetPath = `M0 0 L-100 0 L-100 ${height} L0 ${height} Q0 ${height / 2} 0 0`;

	const curve = {
		initial: { d: initialPath },
		enter: {
			d: targetPath,
			transition: {
				duration: 1,
				ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
			},
		},
		exit: {
			d: initialPath,
			transition: {
				duration: 0.8,
				ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
			},
		},
	};

	return (
		<svg
			className="absolute top-0 -right-[99px] w-[100px] stroke-none h-full pointer-events-none"
			style={{ fill: "#0a0a0a" }}
		>
			<motion.path
				variants={curve}
				initial="initial"
				animate="enter"
				exit="exit"
			/>
		</svg>
	);
};

// ── Black-Themed Curved Navbar with Collections Submenu ─────────
export const CurvedNavbar: React.FC<iCurvedNavbarProps> = ({
	isActive,
	setIsActive,
	collections = [
		{ name: "Tees", slug: "tees" },
		{ name: "Hoodies", slug: "hoodie" },
	],
	footer,
}) => {
	const [collectionsOpen, setCollectionsOpen] = useState(true);
	const [loggedIn, setLoggedIn] = useState(false);
	const supabase = createClient();

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			setLoggedIn(!!data.user);
		});
	}, [supabase]);

	// Body scroll lock
	useEffect(() => {
		if (isActive) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isActive]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		setLoggedIn(false);
		setIsActive(false);
		window.location.href = "/";
	};

	return (
		<AnimatePresence mode="wait">
			{isActive && (
				<>
					{/* Dark backdrop blur overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
						onClick={() => setIsActive(false)}
						className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
					/>

					{/* Sliding black panel */}
					<motion.div
						variants={MENU_SLIDE_ANIMATION}
						initial="initial"
						animate="enter"
						exit="exit"
						className="h-[100dvh] w-screen max-w-screen-sm fixed left-0 top-0 z-50 bg-[#0a0a0a] text-white shadow-2xl flex flex-col justify-between border-r border-white/10"
					>
						<div className="h-full pt-16 md:pt-20 pb-4 flex flex-col justify-between overflow-y-auto">
							<div className="flex flex-col gap-2 mt-0 px-8 md:px-14">
								{/* Header branding */}
								<div className="text-white border-b border-white/20 uppercase text-xs tracking-[0.2em] pb-3 mb-2 font-semibold flex justify-between items-center">
									<Link href="/" onClick={() => setIsActive(false)}>
										<Image
											src="/brand-logo.svg"
											alt="6XTN"
											width={75}
											height={30}
											className="h-6 w-auto"
										/>
									</Link>
									<span className="text-[10px] text-white/40 tracking-widest">
										NAVIGATION
									</span>
								</div>

								{/* Navigation items list */}
								<section className="bg-transparent mt-0">
									<div className="mx-auto max-w-7xl">
										{/* 01. Home */}
										<NavLink
											heading="Home"
											href="/"
											setIsActive={setIsActive}
											index={1}
										/>

										{/* 02. Collections with Expandable Tees, Hoodies, etc. */}
										<div className="border-b border-white/15 py-2.5 md:py-3.5 uppercase">
											<button
												type="button"
												onClick={() => setCollectionsOpen(!collectionsOpen)}
												className="w-full flex items-center justify-between text-left group cursor-pointer"
											>
												<div className="relative flex items-center">
													<span className="text-white/40 group-hover:text-white transition-colors duration-500 text-2xl md:text-3xl font-thin mr-3">
														02.
													</span>
													<span className="text-2xl md:text-3xl font-extralight text-white transition-colors duration-500 tracking-wider group-hover:text-white/70">
														Collections
													</span>
												</div>
												<ChevronDown
													className={cn(
														"w-5 h-5 text-white/50 transition-transform duration-300 mr-2 group-hover:text-white",
														collectionsOpen && "rotate-180"
													)}
												/>
											</button>

											<AnimatePresence>
												{collectionsOpen && (
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: "auto" }}
														exit={{ opacity: 0, height: 0 }}
														transition={{ duration: 0.25, ease: "easeInOut" }}
														className="overflow-hidden pl-11 pt-3 pb-1 space-y-2.5 border-l border-white/20 ml-3.5 mt-2"
													>
														<Link
															href="/collections/tees"
															onClick={() => setIsActive(false)}
															className="block text-base md:text-lg font-light text-white/75 hover:text-white hover:translate-x-1 uppercase tracking-widest transition-all duration-150"
														>
															Tees
														</Link>
														<Link
															href="/collections/hoodie"
															onClick={() => setIsActive(false)}
															className="block text-base md:text-lg font-light text-white/75 hover:text-white hover:translate-x-1 uppercase tracking-widest transition-all duration-150"
														>
															Hoodies
														</Link>
														{collections
															.filter(
																(c) =>
																	c.slug !== "tees" &&
																	c.slug !== "t-shirts" &&
																	c.slug !== "hoodie" &&
																	c.slug !== "hoodies"
															)
															.map((col) => (
																<Link
																	key={col.slug}
																	href={`/collections/${col.slug}`}
																	onClick={() => setIsActive(false)}
																	className="block text-base md:text-lg font-light text-white/75 hover:text-white hover:translate-x-1 uppercase tracking-widest transition-all duration-150"
																>
																	{col.name}
																</Link>
															))}
														<Link
															href="/collections/all"
															onClick={() => setIsActive(false)}
															className="block text-xs uppercase tracking-widest text-white/40 hover:text-white pt-1 transition-colors"
														>
															Shop All Collections →
														</Link>
													</motion.div>
												)}
											</AnimatePresence>
										</div>

										{/* 03. Shop All */}
										<NavLink
											heading="Shop All"
											href="/collections/all"
											setIsActive={setIsActive}
											index={3}
										/>

										{/* 04. Account */}
										<NavLink
											heading="Account"
											href="/account"
											setIsActive={setIsActive}
											index={4}
										/>

										{/* 05. Orders */}
										<NavLink
											heading="Orders"
											href="/account/orders"
											setIsActive={setIsActive}
											index={5}
										/>

										{/* 06. Wishlist */}
										<NavLink
											heading="Wishlist"
											href="/account/wishlist"
											setIsActive={setIsActive}
											index={6}
										/>
									</div>
								</section>
							</div>

							{/* Footer */}
							{footer || (
								<CustomFooter
									loggedIn={loggedIn}
									onSignOut={handleSignOut}
									onClose={() => setIsActive(false)}
								/>
							)}
						</div>
						<Curve />
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default CurvedNavbar;
