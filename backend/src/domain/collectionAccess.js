const LEVEL = { viewer: 1, editor: 2, owner: 3 };

function canAccess(actualRole, requiredRole) {
  return Boolean(LEVEL[actualRole] && LEVEL[actualRole] >= LEVEL[requiredRole]);
}

module.exports = { canAccess };
