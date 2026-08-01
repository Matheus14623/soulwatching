const RECOVERY_MESSAGE =
  'Os arquivos privados deste workspace estão incompletos ou inconsistentes. '
  + 'Ele não pode ser retomado, mas pode ser excluído com segurança.';

export function isCorruptedWorkspace(workspace) {
  return workspace?.corrupted === true;
}

export function corruptedWorkspacePresentation(workspace) {
  if (!isCorruptedWorkspace(workspace)) return null;
  const identifier = typeof workspace.id === 'string'
    ? workspace.id.slice(0, 8)
    : 'desconhecido';
  return Object.freeze({
    canResume: false,
    deleteLabel: 'Excluir workspace corrompido',
    description: RECOVERY_MESSAGE,
    eyebrow: `RECUPERAÇÃO LOCAL · ${identifier}`,
    title: 'Workspace corrompido',
  });
}
