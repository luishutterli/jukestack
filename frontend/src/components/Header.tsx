import type { User } from "../util/APIWrapper";

function Header({user, sticky = false} : {user?: User, sticky?: boolean}) {
	return (
		<header className={`flex flex-row border-b-2 border-gray-200 items-center justify-between px-4 ${sticky ? "sticky top-0 z-10" : ""}`}>
			<div className="relative flex flex-row items-end">
				<h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text pb-2 pl-1">
					JukeStack
				</h1>
				<h2 className="ml-1 italic text-xs pb-2">NFT Music Library by Luis Hutterli</h2>
			</div>
			{user ? (user.email) : (<h2>as</h2>)}
		</header>
	);
}

export default Header;
