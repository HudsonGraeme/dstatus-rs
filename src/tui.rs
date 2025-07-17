use crate::config::{Button, Config};
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{prelude::*, widgets::*};
use std::io;
use unicode_width::UnicodeWidthStr;

struct App {
    config: Config,
    current_field: usize,
    editing_button: Option<(usize, usize)>, // (button_index, field_index)
    error_message: Option<String>,
}

impl App {
    fn new(config: Config) -> Self {
        Self {
            config,
            current_field: 0,
            editing_button: None,
            error_message: None,
        }
    }
}

pub fn run_tui(config: Config) -> io::Result<Config> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new(config.clone());

    loop {
        terminal.draw(|f| ui(f, &mut app))?;

        if let Event::Key(key) = event::read()? {
            let num_buttons = app.config.buttons.as_ref().map_or(0, |b| b.len());
            let total_navigable_items = 8 + num_buttons;

            match key.code {
                KeyCode::Esc => {
                    if app.editing_button.is_some() {
                        app.editing_button = None;
                    } else {
                        if let Some(buttons) = &app.config.buttons {
                            for button in buttons {
                                if button.label.is_empty() || button.url.is_empty() {
                                    app.error_message =
                                        Some("Button labels and URLs cannot be empty.".to_string());
                                    continue;
                                }
                            }
                        }
                        if app.error_message.is_none() {
                            break;
                        }
                    }
                }
                KeyCode::Tab => {
                    app.error_message = None;
                    if let Some((button_index, field_index)) = app.editing_button {
                        app.editing_button = Some((button_index, (field_index + 1) % 2));
                    } else {
                        app.current_field = (app.current_field + 1) % total_navigable_items;
                    }
                }
                KeyCode::BackTab => {
                    app.error_message = None;
                    if let Some((button_index, field_index)) = app.editing_button {
                        app.editing_button = Some((button_index, (field_index + 1) % 2));
                    } else {
                        if app.current_field == 0 {
                            app.current_field = total_navigable_items - 1;
                        } else {
                            app.current_field -= 1;
                        }
                    }
                }
                KeyCode::Char(c) => {
                    app.error_message = None;
                    handle_char_input(&mut app, c);
                }
                KeyCode::Backspace => {
                    app.error_message = None;
                    if let Some(index) = get_selected_button_index(&app) {
                        delete_button_at_index(&mut app, index);
                    } else {
                        handle_backspace(&mut app);
                    }
                }
                KeyCode::Enter => {
                    app.error_message = None;
                    if app.editing_button.is_some() {
                        app.editing_button = None;
                    } else if app.current_field == 7 {
                        if app.config.buttons.is_none() {
                            app.config.buttons = Some(Vec::new());
                        }
                        app.config.buttons.as_mut().unwrap().push(Button {
                            label: String::new(),
                            url: String::new(),
                        });
                    } else if app.current_field >= 8 {
                        let button_index = app.current_field - 8;
                        if button_index < num_buttons {
                            app.editing_button = Some((button_index, 0));
                        }
                    }
                }
                KeyCode::Delete => {
                    app.error_message = None;
                    if let Some(index) = get_deletable_button_index(&app) {
                        delete_button_at_index(&mut app, index);
                    }
                }
                _ => {}
            }
        }
    }

    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    Ok(app.config)
}

fn get_selected_button_index(app: &App) -> Option<usize> {
    if app.editing_button.is_none() && app.current_field >= 8 {
        let button_index = app.current_field - 8;
        if let Some(buttons) = &app.config.buttons {
            if button_index < buttons.len() {
                return Some(button_index);
            }
        }
    }
    None
}

fn get_deletable_button_index(app: &App) -> Option<usize> {
    if let Some((button_index, _)) = app.editing_button {
        return Some(button_index);
    }
    get_selected_button_index(app)
}

fn delete_button_at_index(app: &mut App, index: usize) {
    if let Some(buttons) = app.config.buttons.as_mut() {
        if index < buttons.len() {
            buttons.remove(index);
            app.editing_button = None;
            if app.current_field >= 8 + buttons.len() && !buttons.is_empty() {
                app.current_field = 8 + buttons.len() - 1;
            } else if buttons.is_empty() {
                app.current_field = 7; // Focus "Add Button"
            }
        }
    }
}

fn handle_char_input(app: &mut App, c: char) {
    if let Some((button_index, field_index)) = app.editing_button {
        let button = &mut app.config.buttons.as_mut().unwrap()[button_index];
        if field_index == 0 {
            button.label.push(c);
        } else {
            button.url.push(c);
        }
    } else {
        match app.current_field {
            0 => app.config.client_id.push(c),
            1 => app.config.details.push(c),
            2 => app.config.state.push(c),
            3 => app.config.large_image.push(c),
            4 => app.config.large_text.push(c),
            5 => app.config.small_image.push(c),
            6 => app.config.small_text.push(c),
            _ => {}
        }
    }
}

fn handle_backspace(app: &mut App) {
    if let Some((button_index, field_index)) = app.editing_button {
        let button = &mut app.config.buttons.as_mut().unwrap()[button_index];
        if field_index == 0 {
            button.label.pop();
        } else {
            button.url.pop();
        }
    } else {
        match app.current_field {
            0 => app.config.client_id.pop(),
            1 => app.config.details.pop(),
            2 => app.config.state.pop(),
            3 => app.config.large_image.pop(),
            4 => app.config.large_text.pop(),
            5 => app.config.small_image.pop(),
            6 => app.config.small_text.pop(),
            _ => None,
        };
    }
}

fn ui(f: &mut Frame, app: &mut App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(2)
        .constraints(
            [
                Constraint::Length(3), // Client ID
                Constraint::Length(3), // Details
                Constraint::Length(3), // State
                Constraint::Length(3), // Large Image
                Constraint::Length(3), // Large Text
                Constraint::Length(3), // Small Image
                Constraint::Length(3), // Small Text
                Constraint::Length(3), // Add Button
                Constraint::Min(3),    // Buttons
                Constraint::Length(1), // Instructions
            ]
            .as_ref(),
        )
        .split(f.size());

    if let Some(error) = &app.error_message {
        let error_p = Paragraph::new(error.as_str()).style(Style::default().fg(Color::Red));
        f.render_widget(error_p, chunks[9]);
        return;
    }

    let fields = [
        ("Client ID", &app.config.client_id),
        ("Details", &app.config.details),
        ("State", &app.config.state),
        ("Large Image", &app.config.large_image),
        ("Large Text", &app.config.large_text),
        ("Small Image", &app.config.small_image),
        ("Small Text", &app.config.small_text),
    ];

    for (i, (title, value)) in fields.iter().enumerate() {
        let input = Paragraph::new(value.as_str())
            .style(if app.current_field == i && app.editing_button.is_none() {
                Style::default().fg(Color::Yellow)
            } else {
                Style::default()
            })
            .block(Block::default().borders(Borders::ALL).title(*title));
        f.render_widget(input, chunks[i]);

        if app.current_field == i && app.editing_button.is_none() {
            f.set_cursor(
                chunks[i].x + value.width() as u16 + 1,
                chunks[i].y + 1,
            );
        }
    }

    let add_button = Paragraph::new("Add Button")
        .style(if app.current_field == 7 {
            Style::default().fg(Color::Yellow)
        } else {
            Style::default()
        })
        .block(Block::default().borders(Borders::ALL).title(""));
    f.render_widget(add_button, chunks[7]);

    if let Some(buttons) = &app.config.buttons {
        let button_container_block = Block::default().borders(Borders::ALL).title("Buttons");
        let button_container_area = chunks[8];
        f.render_widget(button_container_block, button_container_area);

        if buttons.is_empty() {
            return;
        }

        let button_list_layout = Layout::default()
            .direction(Direction::Vertical)
            .margin(1)
            .constraints(buttons.iter().map(|_| Constraint::Length(5)).collect::<Vec<_>>())
            .split(button_container_area);

        for (i, button) in buttons.iter().enumerate() {
            let button_area = button_list_layout[i];
            let button_block = Block::default()
                .borders(Borders::ALL)
                .border_style(if app.current_field == 8 + i {
                    Style::default().fg(Color::Yellow)
                } else {
                    Style::default()
                });
            let inner_area = button_block.inner(button_area);
            f.render_widget(button_block, button_area);

            let button_layout = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Percentage(50), Constraint::Percentage(50)].as_ref())
                .split(inner_area);

            let label_input = Paragraph::new(button.label.as_str())
                .style(
                    if app.editing_button == Some((i, 0)) {
                        Style::default().fg(Color::Yellow)
                    } else {
                        Style::default()
                    },
                )
                .block(Block::default().borders(Borders::ALL).title("Button Label"));
            f.render_widget(label_input, button_layout[0]);

            let url_input = Paragraph::new(button.url.as_str())
                .style(
                    if app.editing_button == Some((i, 1)) {
                        Style::default().fg(Color::Yellow)
                    } else {
                        Style::default()
                    },
                )
                .block(Block::default().borders(Borders::ALL).title("Button URL"));
            f.render_widget(url_input, button_layout[1]);

            if let Some((editing_i, editing_field)) = app.editing_button {
                if i == editing_i {
                    match editing_field {
                        0 => f.set_cursor(
                            button_layout[0].x + button.label.width() as u16 + 1,
                            button_layout[0].y + 1,
                        ),
                        1 => f.set_cursor(
                            button_layout[1].x + button.url.width() as u16 + 1,
                            button_layout[1].y + 1,
                        ),
                        _ => {}
                    }
                }
            }
        }
    }

    let instructions =
        Paragraph::new("Tab: Navigate | Enter: Edit/Add | Del: Delete | Backspace: Delete Char/Button | Esc: Save & Exit")
            .style(Style::default().fg(Color::DarkGray));
    f.render_widget(instructions, chunks[9]);
}
