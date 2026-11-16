package main;

import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.MouseEvent;
import javax.swing.JPanel;
import inputs.KeyboardInputs;
import inputs.MouseInputs;
import static main.Game.GAME_HEIGHT;
import static main.Game.GAME_WIDTH;

public class GamePanel extends JPanel {

	private MouseInputs mouseInputs;
	private Game game;

	public GamePanel(Game game) {
		mouseInputs = new MouseInputs(this);
		this.game = game;
		setPanelSize();
		addKeyListener(new KeyboardInputs(this));
		addMouseListener(mouseInputs);
		addMouseMotionListener(mouseInputs);
	}

	private void setPanelSize() {
		Dimension size = new Dimension(GAME_WIDTH, GAME_HEIGHT);
		setPreferredSize(size);
	}

	public void updateGame() {

	}

	public void paintComponent(Graphics g) {
		super.paintComponent(g);
		double scale = Math.min(getWidth() / (double) GAME_WIDTH, getHeight() / (double) GAME_HEIGHT);
		int x = (int) ((getWidth() - GAME_WIDTH * scale) / 2);
		int y = (int) ((getHeight() - GAME_HEIGHT * scale) / 2);
		Graphics2D g2 = (Graphics2D) g.create();
		g2.translate(x, y);
		g2.scale(scale, scale);
		game.render(g2);
		g2.dispose();
	}

	public MouseEvent toGameCoordinates(MouseEvent e) {
		double scale = Math.min(getWidth() / (double) GAME_WIDTH, getHeight() / (double) GAME_HEIGHT);
		int x = (int) ((getWidth() - GAME_WIDTH * scale) / 2);
		int y = (int) ((getHeight() - GAME_HEIGHT * scale) / 2);
		return new MouseEvent(this, e.getID(), e.getWhen(), e.getModifiersEx(), (int) ((e.getX() - x) / scale),
				(int) ((e.getY() - y) / scale), e.getXOnScreen(), e.getYOnScreen(), e.getClickCount(), e.isPopupTrigger(), e.getButton());
	}

	public Game getGame() {
		return game;
	}

}
