import type { MorphicWidget, SynapseLink, SynapsePort } from '../types/morphic';

/**
 * Returns available output ports for a widget
 */
export function getWidgetOutputPorts(widget: MorphicWidget): SynapsePort[] {
  const ports: SynapsePort[] = [];

  switch (widget.type) {
    case 'simulation':
      // Formulas as outputs
      (widget.data.formulas || []).forEach((f) => {
        ports.push({
          id: `${widget.id}_out_${f.id}`,
          name: f.id,
          label: f.label,
          type: 'number',
          direction: 'out',
        });
      });
      // Variables as outputs
      (widget.data.variables || []).forEach((v) => {
        ports.push({
          id: `${widget.id}_out_${v.id}`,
          name: v.name,
          label: `${v.label} (パラメータ)`,
          type: 'number',
          direction: 'out',
        });
      });
      break;

    case 'pipeline':
      ports.push(
        {
          id: `${widget.id}_out_progress`,
          name: 'progress_percent',
          label: '進捗率 (%)',
          type: 'number',
          direction: 'out',
        },
        {
          id: `${widget.id}_out_done_count`,
          name: 'done_count',
          label: '完了タスク数',
          type: 'number',
          direction: 'out',
        }
      );
      break;

    case 'tradeoff':
      ports.push(
        {
          id: `${widget.id}_out_winning_score`,
          name: 'winning_score',
          label: '最高適合スコア (pt)',
          type: 'number',
          direction: 'out',
        },
        {
          id: `${widget.id}_out_winning_title`,
          name: 'winning_title',
          label: '推奨選択肢名',
          type: 'string',
          direction: 'out',
        }
      );
      break;

    case 'matrix':
      ports.push(
        {
          id: `${widget.id}_out_item_count`,
          name: 'item_count',
          label: '要素総数',
          type: 'number',
          direction: 'out',
        },
        {
          id: `${widget.id}_out_critical_count`,
          name: 'critical_count',
          label: '重大象限要素数',
          type: 'number',
          direction: 'out',
        }
      );
      break;

    case 'synapse_notes':
      ports.push({
        id: `${widget.id}_out_char_count`,
        name: 'char_count',
        label: 'メモ文字数',
        type: 'number',
        direction: 'out',
      });
      break;

    case 'custom':
      (widget.data.customFields || []).forEach((f) => {
        ports.push({
          id: `${widget.id}_out_${f.id}`,
          name: f.id,
          label: f.label,
          type: f.type === 'number' ? 'number' : 'string',
          direction: 'out',
        });
      });
      break;
  }

  return ports;
}

/**
 * Returns available input ports for a widget
 */
export function getWidgetInputPorts(widget: MorphicWidget): SynapsePort[] {
  const ports: SynapsePort[] = [];

  switch (widget.type) {
    case 'simulation':
      // Variables can receive inputs
      (widget.data.variables || []).forEach((v) => {
        ports.push({
          id: `${widget.id}_in_${v.id}`,
          name: v.id,
          label: `${v.label} (上書き入力)`,
          type: 'number',
          direction: 'in',
        });
      });
      break;

    case 'tradeoff':
      // Criteria weights can receive inputs
      (widget.data.criteria || []).forEach((c) => {
        ports.push({
          id: `${widget.id}_in_${c.id}`,
          name: c.id,
          label: `基準: ${c.name} (重要度 1-5)`,
          type: 'number',
          direction: 'in',
        });
      });
      break;

    case 'custom':
      (widget.data.customFields || []).forEach((f) => {
        ports.push({
          id: `${widget.id}_in_${f.id}`,
          name: f.id,
          label: f.label,
          type: f.type === 'number' ? 'number' : 'string',
          direction: 'in',
        });
      });
      break;
  }

  return ports;
}

/**
 * Propagate values across Synapse links and update widgets
 */
export function propagateSynapseValues(
  widgets: MorphicWidget[],
  synapses: SynapseLink[],
  busState: Record<string, any>
): { updatedWidgets: MorphicWidget[]; hasChanges: boolean } {
  if (synapses.length === 0) return { updatedWidgets: widgets, hasChanges: false };

  let hasChanges = false;
  const updatedWidgets = widgets.map((targetWidget) => {
    // Find synapses targeting this widget
    const incomingLinks = synapses.filter((s) => s.targetWidgetId === targetWidget.id);
    if (incomingLinks.length === 0) return targetWidget;

    let modified = false;
    let newWidget = { ...targetWidget };

    incomingLinks.forEach((link) => {
      // Find source widget
      const sourceWidget = widgets.find((w) => w.id === link.sourceWidgetId);
      if (!sourceWidget) return;

      // Determine source value from bus or source widget
      let sourceValue: any = busState[`${sourceWidget.id}_${link.sourceKey}`] ?? busState[link.sourceKey];

      // Fallback: calculate directly from source
      if (sourceValue === undefined) {
        if (sourceWidget.type === 'pipeline') {
          const items = (sourceWidget.data.stages || []).flatMap((s) => s.items);
          const done = items.filter((i) => i.done).length;
          sourceValue = link.sourceKey === 'done_count' ? done : Math.round((done / (items.length || 1)) * 100);
        } else if (sourceWidget.type === 'simulation') {
          const v = (sourceWidget.data.variables || []).find((v) => v.name === link.sourceKey || v.id === link.sourceKey);
          if (v) sourceValue = v.value;
        }
      }

      if (sourceValue === undefined) return;

      // Apply multiplier if present
      const finalValue =
        typeof sourceValue === 'number' && link.multiplier ? sourceValue * link.multiplier : sourceValue;

      // Apply to target widget based on type
      if (newWidget.type === 'simulation') {
        const targetVars = newWidget.data.variables || [];
        const varIdx = targetVars.findIndex((v) => v.id === link.targetKey || v.name === link.targetKey);
        if (varIdx !== -1 && typeof finalValue === 'number') {
          const targetVar = targetVars[varIdx];
          const clamped = Math.max(targetVar.min, Math.min(targetVar.max, Math.round(finalValue)));
          if (targetVar.value !== clamped) {
            const newVars = [...targetVars];
            newVars[varIdx] = { ...targetVar, value: clamped };
            newWidget = {
              ...newWidget,
              data: { ...newWidget.data, variables: newVars },
            };
            modified = true;
          }
        }
      } else if (newWidget.type === 'tradeoff') {
        const criteria = newWidget.data.criteria || [];
        const critIdx = criteria.findIndex((c) => c.id === link.targetKey);
        if (critIdx !== -1 && typeof finalValue === 'number') {
          const clamped = Math.max(1, Math.min(5, Math.round(finalValue)));
          if (criteria[critIdx].weight !== clamped) {
            const newCriteria = [...criteria];
            newCriteria[critIdx] = { ...criteria[critIdx], weight: clamped };
            newWidget = {
              ...newWidget,
              data: { ...newWidget.data, criteria: newCriteria },
            };
            modified = true;
          }
        }
      }
    });

    if (modified) {
      hasChanges = true;
      return newWidget;
    }
    return targetWidget;
  });

  return { updatedWidgets, hasChanges };
}
