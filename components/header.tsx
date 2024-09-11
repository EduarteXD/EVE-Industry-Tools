import LocaleSwitch from "./locale-switch";

export default function Header() {
  return (
    <>
      <div className="top-0 left-0 w-full h-16 border-b flex items-center gap-2 px-6 justify-between fixed bg-white z-50">
        <div className="font-bold text-xl">EVE Industry Tools</div>
        <LocaleSwitch />
      </div>
      <div className="h-16"></div>
    </>
  )
}