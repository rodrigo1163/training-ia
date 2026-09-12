import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

const iconTransition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
} as const

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'type'
>

function PasswordInput({
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className={className}>
      <InputGroupInput
        className="h-full [&::-ms-reveal]:hidden"
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          size="icon-xs"
        >
          <span className="relative grid size-4 place-items-center">
            <AnimatePresence initial={false}>
              <motion.span
                key={visible ? 'hide' : 'show'}
                aria-hidden="true"
                className="col-start-1 row-start-1 flex"
                initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
                transition={iconTransition}
              >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
              </motion.span>
            </AnimatePresence>
          </span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordInput }
