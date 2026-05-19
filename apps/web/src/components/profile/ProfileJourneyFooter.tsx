import { Link } from "react-router-dom";

interface ProfileJourneyFooterProps {
  isOwner: boolean;
  hasProfile: boolean;
}

/**
 * The "continue the journey" footer — mirrors the prev/next card pattern
 * used by AboutLayout. Owner gets directory + sign-out routes; visitors
 * get directory + join routes.
 */
export function ProfileJourneyFooter({
  isOwner,
  hasProfile,
}: ProfileJourneyFooterProps) {
  return (
    <div className="border-t border-neutral-100 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Link
            to="/members"
            className="group flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-white hover:shadow-sm transition-all"
          >
            <svg
              className="w-5 h-5 text-neutral-400 group-hover:text-purple-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Browse</p>
              <p className="text-sm font-semibold text-neutral-700 group-hover:text-purple-700 transition-colors">
                Member directory
              </p>
            </div>
          </Link>

          {isOwner ? (
            <Link
              to={hasProfile ? "/account" : "/account"}
              className="group flex items-center gap-3 px-5 py-4 rounded-xl bg-teal-50 hover:bg-teal-100 transition-all text-right"
            >
              <div>
                <p className="text-xs text-teal-600 font-medium">
                  {hasProfile ? "Keep building" : "Continue setup"}
                </p>
                <p className="text-sm font-bold text-teal-700">
                  {hasProfile
                    ? "Add your career history"
                    : "Set up your profile"}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-teal-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ) : (
            <Link
              to="/sign-up"
              className="group flex items-center gap-3 px-5 py-4 rounded-xl bg-teal-50 hover:bg-teal-100 transition-all text-right"
            >
              <div>
                <p className="text-xs text-teal-600 font-medium">
                  Want to be listed?
                </p>
                <p className="text-sm font-bold text-teal-700">
                  Join US-RSE — it's free
                </p>
              </div>
              <svg
                className="w-5 h-5 text-teal-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
