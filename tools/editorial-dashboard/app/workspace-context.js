export function createWorkspaceContextGuard() {
  let epoch = 0;

  return Object.freeze({
    beginTransition() {
      epoch += 1;
      return epoch;
    },

    capture(workspaceId) {
      return Object.freeze({
        epoch,
        workspaceId: workspaceId || null,
      });
    },

    isCurrent(context, workspaceId) {
      return Boolean(
        context?.workspaceId
        && context.epoch === epoch
        && context.workspaceId === workspaceId,
      );
    },

    isEpochCurrent(candidate) {
      return candidate === epoch;
    },
  });
}
