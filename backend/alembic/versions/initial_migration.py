"""initial migration

Revision ID: 001
Revises: 
Create Date: 2023-04-14

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    op.create_index('idx_user_email', 'users', ['email'], unique=True)
    op.create_index('idx_user_id', 'users', ['id'], unique=False)
    
    # Create stock_groups table
    op.create_table(
        'stock_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['parent_id'], ['stock_groups.id']),
        sa.UniqueConstraint('name')
    )
    op.create_index('idx_stock_group_id', 'stock_groups', ['id'], unique=False)
    op.create_index('idx_stock_group_name', 'stock_groups', ['name'], unique=True)
    
    # Create stocks table
    op.create_table(
        'stocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('note', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('symbol')
    )
    op.create_index('idx_stock_id', 'stocks', ['id'], unique=False)
    op.create_index('idx_stock_symbol', 'stocks', ['symbol'], unique=True)
    
    # Create association table
    op.create_table(
        'group_stock_association',
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('stock_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['stock_groups.id']),
        sa.ForeignKeyConstraint(['stock_id'], ['stocks.id']),
        sa.PrimaryKeyConstraint('group_id', 'stock_id')
    )
    
    # Create default stock group
    op.execute(
        "INSERT INTO stock_groups (name, description) VALUES ('默认分组', '默认股票分组')"
    )


def downgrade():
    op.drop_table('group_stock_association')
    op.drop_table('stocks')
    op.drop_table('stock_groups')
    op.drop_table('users') 