import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function ArrowFilled({ size = 10, color = colors.dark }: Props) {
  return (
    <Svg
      width={size}
      height={(size / 10) * 6}
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="M5 6L0.669873 1.38009e-07L9.33013 8.95112e-07L5 6Z" fill={color} />
    </Svg>
  )
}

export default React.memo(ArrowFilled)
