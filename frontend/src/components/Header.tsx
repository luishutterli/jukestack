function Header() {
	return (
		<header className="flex flex-row border-b-2 border-gray-200 items-center justify-between">
			<div className="relative flex flex-row items-end pl-2">
				<h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text">
					JukeStack
				</h1>
				<h2 className="ml-1 italic text-xs">NFT Music Library by Luis Hutterli</h2>
			</div>
			<h2>as</h2>
		</header>
	);
}

export default Header;
