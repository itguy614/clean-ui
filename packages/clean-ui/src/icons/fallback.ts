/**
 * Rendered when a name cannot be resolved at all. Its own module so CuiIcon imports one
 * icon, not the whole built-in set (#207).
 */
import { IconQuestion } from "./generated/question";

export const FALLBACK_ICON = IconQuestion;
