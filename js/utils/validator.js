window.LevelValidator = (function () {
  const TRACK_COUNT = 4;
  const MAX_NOTES = 2000;
  const MIN_DURATION = 5000;

  function isPositiveNumber(val) {
    return typeof val === 'number' && isFinite(val) && val > 0;
  }

  function isNonNegativeNumber(val) {
    return typeof val === 'number' && isFinite(val) && val >= 0;
  }

  function isValidNote(note, index) {
    const errors = [];

    if (!note || typeof note !== 'object') {
      return [`音符 #${index}: 不是有效的对象`];
    }

    if (typeof note.id === 'undefined' || note.id === null) {
      errors.push(`音符 #${index}: 缺少 id 字段`);
    }

    if (!isNonNegativeNumber(note.track) || note.track >= TRACK_COUNT) {
      errors.push(`音符 #${index}: track 必须是 0-${TRACK_COUNT - 1} 之间的整数，当前值: ${note.track}`);
    }

    if (!isNonNegativeNumber(note.time)) {
      errors.push(`音符 #${index}: time 必须是非负数字，当前值: ${note.time}`);
    }

    if (note.type !== 'tap' && note.type !== 'hold') {
      errors.push(`音符 #${index}: type 必须是 'tap' 或 'hold'，当前值: ${note.type}`);
    }

    if (note.type === 'hold') {
      if (!isPositiveNumber(note.duration)) {
        errors.push(`音符 #${index}: hold 类型音符必须有正的 duration，当前值: ${note.duration}`);
      }
    }

    return errors;
  }

  function validate(level) {
    const errors = [];
    const warnings = [];

    if (!level || typeof level !== 'object') {
      return {
        valid: false,
        errors: ['关卡数据不是有效的对象'],
        warnings: []
      };
    }

    if (!isPositiveNumber(level.noteSpeed)) {
      errors.push(`noteSpeed 必须是正数，当前值: ${level.noteSpeed}`);
    }

    if (!isPositiveNumber(level.duration) || level.duration < MIN_DURATION) {
      errors.push(`duration 必须大于 ${MIN_DURATION}ms，当前值: ${level.duration}`);
    }

    if (!level.judgeWindows || typeof level.judgeWindows !== 'object') {
      errors.push('缺少 judgeWindows 配置');
    } else {
      const jw = level.judgeWindows;
      if (!isPositiveNumber(jw.perfect)) errors.push('judgeWindows.perfect 必须是正数');
      if (!isPositiveNumber(jw.great)) errors.push('judgeWindows.great 必须是正数');
      if (!isPositiveNumber(jw.miss)) errors.push('judgeWindows.miss 必须是正数');

      if (isPositiveNumber(jw.perfect) && isPositiveNumber(jw.great) && jw.perfect >= jw.great) {
        errors.push('judgeWindows.perfect 必须小于 judgeWindows.great');
      }
      if (isPositiveNumber(jw.great) && isPositiveNumber(jw.miss) && jw.great >= jw.miss) {
        errors.push('judgeWindows.great 必须小于 judgeWindows.miss');
      }
    }

    if (!Array.isArray(level.notes)) {
      errors.push('notes 必须是数组');
    } else {
      if (level.notes.length === 0) {
        warnings.push('notes 数组为空，游戏将没有音符');
      }
      if (level.notes.length > MAX_NOTES) {
        warnings.push(`notes 数量过多 (${level.notes.length})，建议不超过 ${MAX_NOTES}`);
      }

      let prevTime = -1;
      let prevId = null;
      const idSet = new Set();

      level.notes.forEach((note, i) => {
        const noteErrors = isValidNote(note, i);
        errors.push(...noteErrors);

        if (note && typeof note.id !== 'undefined' && note.id !== null) {
          if (idSet.has(note.id)) {
            errors.push(`音符 #${i}: id 重复 (${note.id})`);
          }
          idSet.add(note.id);
        }

        if (note && isNonNegativeNumber(note.time)) {
          if (note.time < prevTime) {
            warnings.push(`音符 #${i}: 时间顺序异常，前一个音符时间: ${prevTime}ms，当前: ${note.time}ms`);
          }
          prevTime = note.time;

          if (isPositiveNumber(level.duration) && note.time > level.duration) {
            warnings.push(`音符 #${i}: 时间 (${note.time}ms) 超出关卡时长 (${level.duration}ms)`);
          }
        }
        prevId = note ? note.id : null;
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  function getUserFriendlyMessage(result) {
    if (result.valid) {
      if (result.warnings.length === 0) {
        return '关卡数据正常';
      }
      return '关卡数据基本正常，但有以下提示：\n' + result.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n');
    }

    const errorCount = result.errors.length;
    let msg = `检测到 ${errorCount} 个问题：\n`;

    if (errorCount <= 5) {
      result.errors.forEach((e, i) => {
        msg += `${i + 1}. ${e}\n`;
      });
    } else {
      result.errors.slice(0, 5).forEach((e, i) => {
        msg += `${i + 1}. ${e}\n`;
      });
      msg += `... 还有 ${errorCount - 5} 个问题未显示\n`;
    }

    msg += '\n请修复上述问题后重试。';
    return msg;
  }

  return {
    validate: validate,
    getUserFriendlyMessage: getUserFriendlyMessage
  };
})();
