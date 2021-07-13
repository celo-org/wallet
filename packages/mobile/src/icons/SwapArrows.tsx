import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function ArrowFilled({ size = 12, color = colors.dark }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        d="M8.31491 0L5.54492 3.69498H7.39491V8.31496H9.2399V3.69498H11.0899L8.31491 0Z"
        fill={color}
      />
      <Path
        d="M2.77499 12L5.54497 8.30504H3.69498V3.68506H1.84999V8.30504H0L2.77499 12Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(ArrowFilled)
