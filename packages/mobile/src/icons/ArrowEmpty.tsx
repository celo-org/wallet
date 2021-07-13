import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function ArrowFilled({ size = 10, color = colors.gray3 }: Props) {
  return (
    <Svg
      width={size}
      height={(size / 10) * 5}
      viewBox="0 0 12 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="M1 1L6 6L11 1" fill={color} />
    </Svg>
  )
}

export default React.memo(ArrowFilled)
