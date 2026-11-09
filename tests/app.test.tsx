import React from 'react';
import {it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import App from '../App';
it('executa o exemplo sintético pela interface e limpa resultado ao trocar alvo',()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Usar exemplo sintético'}));
 fireEvent.change(screen.getByLabelText('Coluna alvo'),{target:{value:'classe'}});fireEvent.click(screen.getByRole('button',{name:'Treinar e avaliar'}));
 expect(screen.getByRole('heading',{name:'Avaliação em dados separados'})).toBeTruthy();expect(screen.getByText('Precisão macro')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Coluna alvo'),{target:{value:'grupo'}});expect(screen.queryByRole('heading',{name:'Avaliação em dados separados'})).toBeNull();
});
