import { assert } from '$utils/typed';
import { AlignTo, PopoverStyle, Rect } from '../types';

interface AlignOptions {
  alignTo: AlignTo;
  x?: number | undefined;
  y?: number | undefined;
  popoverRect: Rect;
  targetRect: Rect;
  viewportHeight: number;
  viewportWidth: number;
}

function align({
  alignTo,
  x,
  y,
  popoverRect,
  targetRect,
  viewportHeight,
  viewportWidth,
}: AlignOptions): PopoverStyle {
  if (alignTo === 'auto-cursor' && (x == null || y == null)) {
    alignTo = 'auto-target';
  }

  let centerX = targetRect.x + (targetRect.width - popoverRect.width) / 2;
  if (centerX < 0) {
    centerX = 0;
  } else if (centerX + popoverRect.width > viewportWidth) {
    centerX = viewportWidth - popoverRect.width;
  }

  let centerY = targetRect.y + (targetRect.height - popoverRect.height) / 2;
  if (centerY < 0) {
    centerY = 0;
  } else if (centerY + popoverRect.height > viewportHeight) {
    centerY = viewportHeight - popoverRect.height;
  }

  switch (alignTo) {
    case 'above': {
      return {
        left: centerX,
        top: targetRect.y - popoverRect.height,
      };
    }
    case 'auto-cursor': {
      assert(x != null && y != null);

      const style: PopoverStyle = {
        left: x,
        top: y,
      };

      if (popoverRect.width > viewportWidth) {
        style.left = 0;
      } else if (x + popoverRect.width > viewportWidth) {
        style.left = x - popoverRect.width;
      }

      if (popoverRect.height > viewportHeight) {
        style.top = 0;
      } else if (y + popoverRect.height > viewportHeight) {
        style.top = y - popoverRect.height;
      }

      return style;
    }
    case 'auto-target': {
      if (targetRect.bottom + popoverRect.height > viewportHeight) {
        return {
          left: targetRect.x,
          top: Math.max(0, targetRect.y - popoverRect.height),
          width: targetRect.width,
        };
      } else {
        return {
          left: targetRect.x,
          top: targetRect.bottom,
          width: targetRect.width,
        };
      }
    }
    case 'below': {
      return {
        left: centerX,
        top: targetRect.bottom,
      };
    }
    case 'left': {
      return {
        left: targetRect.x - popoverRect.width,
        top: centerY,
      };
    }
    case 'right': {
      return {
        left: targetRect.right,
        top: centerY,
      };
    }
  }
}

function doesElementFit(
  style: PopoverStyle,
  { popoverRect, viewportWidth, viewportHeight }: AlignOptions,
) {
  if (style.left < 0 || style.top < 0) {
    return false;
  }

  const width = style.width ?? popoverRect.width;
  const height = style.height ?? popoverRect.height;
  if (
    style.left + width > viewportWidth ||
    style.top + height > viewportHeight
  ) {
    return false;
  }

  return true;
}

export function calculatePopoverStyle(options: AlignOptions): PopoverStyle {
  let style = align(options);

  if (!doesElementFit(style, options)) {
    if (options.alignTo === 'below') {
      options.alignTo = 'above';
    }

    if (options.alignTo === 'right') {
      options.alignTo = 'left';
    }

    style = align(options);
  }

  return style;
}
