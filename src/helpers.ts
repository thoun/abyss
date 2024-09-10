

function colorFaction(text: string, faction: number) {
    let color = 'black';
    switch (faction) {
        case 0: color = 'purple'; break;
        case 1: color = 'red'; break;
        case 2: color = '#999900'; break;
        case 3: color = 'green'; break;
        case 4: color = 'blue'; break;
        case 10: color = 'gray'; break;
    }
    return `<span style="color: ${color}">${_(text)}</span>`;
  }