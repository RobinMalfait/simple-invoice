export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-content-center bg-white dark:bg-zinc-900">
      <h3 className="text-5xl text-gray-800 dark:text-white">
        {/* By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL */}
        <svg
          className="h-16 w-16 stroke-gray-800 dark:stroke-zinc-500"
          viewBox="0 0 44 44"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="none" fillRule="evenodd" strokeWidth={2}>
            <circle cx={22} cy={22} r={1}>
              <animate
                attributeName="r"
                begin="0s"
                dur="1.8s"
                values="1; 20"
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.165, 0.84, 0.44, 1"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                begin="0s"
                dur="1.8s"
                values="1; 0"
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.3, 0.61, 0.355, 1"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={22} cy={22} r={1}>
              <animate
                attributeName="r"
                begin="-0.9s"
                dur="1.8s"
                values="1; 20"
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.165, 0.84, 0.44, 1"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                begin="-0.9s"
                dur="1.8s"
                values="1; 0"
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.3, 0.61, 0.355, 1"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>
      </h3>
    </div>
  )
}
