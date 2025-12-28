import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF3D5]">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <span className="text-xl font-bold text-[#5C4A32]">Fast Action</span>
          <Link
            href="/login"
            className="text-[#5C4A32] font-medium hover:underline"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-6">
        {/* Hero - offset layout */}
        <div className="pt-16 pb-20 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#5C4A32] leading-[1.1]">
            Your morning inbox routine?
            <br />
            <span className="text-[#C4A484]">We'll handle it.</span>
          </h1>

          <p className="mt-6 text-lg text-[#8B7355] max-w-md">
            AI reads your emails overnight and gives you a simple list: here's what actually needs your attention today.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center mt-8 px-6 py-3 bg-[#5C4A32] text-[#FFF3D5] font-medium rounded-lg hover:bg-[#4A3A28] active:scale-[0.98] transition-all duration-150"
          >
            Try it free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {/* Problems - staggered, not a grid */}
        <div className="py-16 border-t border-[#C4A484]/20">
          <p className="text-sm font-medium text-[#C4A484] uppercase tracking-wide mb-8">
            Sound familiar?
          </p>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-start gap-4">
              <span className="text-2xl">→</span>
              <p className="text-xl text-[#5C4A32]">
                <strong>30 minutes every morning</strong> just figuring out what's urgent
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">→</span>
              <p className="text-xl text-[#5C4A32]">
                <strong>Deadlines hiding</strong> in email threads you forgot to check
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">→</span>
              <p className="text-xl text-[#5C4A32]">
                <strong>That nagging feeling</strong> you're forgetting to reply to something important
              </p>
            </div>
          </div>
        </div>

        {/* How it works - simple */}
        <div className="py-16 border-t border-[#C4A484]/20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
            <div className="md:max-w-xs">
              <p className="text-sm font-medium text-[#C4A484] uppercase tracking-wide mb-3">
                How it works
              </p>
              <p className="text-[#8B7355]">
                Connect Gmail. Pick a time. That's the whole setup.
              </p>
            </div>

            <div className="flex-1 max-w-md">
              <div className="bg-[#5C4A32] text-[#FFF3D5] rounded-xl p-6">
                <p className="text-sm text-[#C4A484] mb-2">Every morning at 7am</p>
                <p className="text-lg font-medium">
                  "You have 3 action items today: reply to Sarah about the proposal, review the Q4 budget, and confirm Friday's meeting."
                </p>
              </div>
              <p className="mt-3 text-sm text-[#8B7355]">
                ↑ What you'll see instead of 47 unread emails
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 border-t border-[#C4A484]/20">
          <p className="text-2xl md:text-3xl font-medium text-[#5C4A32] max-w-md">
            Start tomorrow morning with a clear head.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center mt-6 px-6 py-3 bg-[#5C4A32] text-[#FFF3D5] font-medium rounded-lg hover:bg-[#4A3A28] active:scale-[0.98] transition-all duration-150"
          >
            Get started free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <p className="mt-4 text-sm text-[#8B7355]">
            Read-only access. Your emails stay private.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#C4A484]/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-[#8B7355]">
            <Mail className="w-4 h-4" />
            <span>Fast Action</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
